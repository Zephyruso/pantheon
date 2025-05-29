package main

import (
	"encoding/json"
	"log"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
)

var (
	coreProcess *exec.Cmd
	coreDir     string
	runtimeDir  string
	socketPath  string
)

type Command struct {
	Action string `json:"action"`
}

type StatusResponse struct {
	Running bool `json:"running"`
}

func main() {
	var err error
	var logPath string

	if runtime.GOOS == "windows" {
		logPath = filepath.Join(os.Getenv("TEMP"), "pantheon-helper.log")
		socketPath = `\\.\pipe\pantheon-helper`
		coreDir = filepath.Join(os.Getenv("APPDATA"), "Pantheon")
		runtimeDir = filepath.Join(os.Getenv("APPDATA"), "Pantheon", "runtime")
	} else {
		logPath = filepath.Join("/var/log", "pantheon-helper.log")
		socketPath = filepath.Join("/tmp", "pantheon-helper.sock")
		coreDir = filepath.Join("/usr", "local", "bin")
		runtimeDir = os.Getenv("PANTEHON_CONFIG_DIR")
	}

	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Fatalf("Failed to create log file: %v", err)
	}
	defer logFile.Close()
	log.SetOutput(logFile)

	if err := os.MkdirAll(coreDir, 0755); err != nil {
		log.Fatalf("Failed to create app directory: %v", err)
	}

	if runtime.GOOS != "windows" {
		if _, err := os.Stat(socketPath); err == nil {
			os.Remove(socketPath)
		}
	}

	var listener net.Listener
	if runtime.GOOS == "windows" {
		listener, err = net.Listen("pipe", socketPath)
	} else {
		listener, err = net.Listen("unix", socketPath)
	}
	if err != nil {
		log.Fatalf("Failed to create socket: %v", err)
	}
	defer listener.Close()

	if runtime.GOOS != "windows" {
		if err := os.Chmod(socketPath, 0666); err != nil {
			log.Printf("Failed to set socket permissions: %v", err)
		}
	}

	sigChan := make(chan os.Signal, 1)
	if runtime.GOOS == "windows" {
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	} else {
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	}

	go handleConnections(listener)

	log.Println("pantheon-helper service started")
	<-sigChan
	log.Println("Shutting down service...")
	stopPantheonCore()
	if runtime.GOOS != "windows" {
		os.Remove(socketPath)
	}
}

func handleConnections(listener net.Listener) {
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}
		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	defer conn.Close()

	var cmd Command
	decoder := json.NewDecoder(conn)
	if err := decoder.Decode(&cmd); err != nil {
		log.Printf("Failed to parse command: %v", err)
		return
	}

	var response interface{}
	switch cmd.Action {
	case "start":
		startPantheonCore()
		response = map[string]string{"status": "started"}
	case "stop":
		stopPantheonCore()
		response = map[string]string{"status": "stopped"}
	case "status":
		response = StatusResponse{
			Running: coreProcess != nil,
		}
	default:
		log.Printf("Unknown command: %s", cmd.Action)
		return
	}

	if err := json.NewEncoder(conn).Encode(response); err != nil {
		log.Printf("Failed to send response: %v", err)
	}
}

func startPantheonCore() {
	if coreProcess != nil {
		log.Println("pantheon-core is already running")
		return
	}

	pantheonCorePath := filepath.Join(coreDir, "pantheon-core")
	if _, err := os.Stat(pantheonCorePath); os.IsNotExist(err) {
		log.Printf("Error: pantheon-core binary not found at %s", pantheonCorePath)
		return
	}

	var coreLogPath string
	if runtime.GOOS == "windows" {
		coreLogPath = filepath.Join(os.Getenv("TEMP"), "pantheon-core.log")
	} else {
		coreLogPath = filepath.Join("/var/log", "pantheon-core.log")
	}

	coreLogFile, err := os.OpenFile(coreLogPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("Failed to create core log file: %v", err)
		return
	}

	coreProcess = exec.Command(pantheonCorePath, "run", "-C", runtimeDir)
	coreProcess.Stdout = coreLogFile
	coreProcess.Stderr = coreLogFile

	if err := coreProcess.Start(); err != nil {
		log.Printf("Failed to start pantheon-core: %v", err)
		coreProcess = nil
		coreLogFile.Close()
		return
	}

	log.Println("pantheon-core started")
}

func stopPantheonCore() {
	if coreProcess == nil {
		log.Println("pantheon-core is not running")
		return
	}

	if runtime.GOOS == "windows" {
		if err := coreProcess.Process.Kill(); err != nil {
			log.Printf("Failed to kill process: %v", err)
		}
	} else {
		if err := coreProcess.Process.Signal(syscall.SIGTERM); err != nil {
			log.Printf("Failed to send termination signal: %v", err)
			if err := coreProcess.Process.Kill(); err != nil {
				log.Printf("Failed to force kill: %v", err)
			}
		}
	}

	coreProcess.Wait()
	coreProcess = nil
	log.Println("pantheon-core stopped")
}
