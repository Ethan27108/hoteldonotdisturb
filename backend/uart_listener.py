import serial
import time
import threading

# ----------------------------
# CONFIGURATION
# ----------------------------
SERIAL_PORT = "COM3"      # change to your ESP32 port
BAUD_RATE = 115200
RECONNECT_DELAY = 2        # seconds to retry if device not found


# ----------------------------
# OPEN SERIAL PORT
# ----------------------------
def open_serial():
    """Try to open the serial port and return the serial object."""
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            print(f"[OK] Connected to {SERIAL_PORT} at {BAUD_RATE} baud.")
            return ser
        except serial.SerialException:
            print(f"[ERROR] Could not open {SERIAL_PORT}. Retrying in {RECONNECT_DELAY}s...")
            time.sleep(RECONNECT_DELAY)


# ----------------------------
# SEND COMMANDS TO ESP32
# ----------------------------
def send_dnd(ser):
    ser.write(b"SET:DND\n")
    print("[TX] Sent → SET:DND")

def send_clean(ser):
    ser.write(b"SET:CLEAN\n")
    print("[TX] Sent → SET:CLEAN")


# ----------------------------
# LISTEN FOR ESP32 OUTPUT
# ----------------------------
def listen_serial(ser):
    """Continuous listener thread for UART incoming messages."""
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode(errors="ignore").strip()
                if line:
                    print(f"[ESP32] {line}")

        except serial.SerialException:
            print("[ERROR] Serial connection lost. Reconnecting listener…")
            ser = open_serial()

        except Exception as e:
            print("[ERROR] Unexpected error in listener:", e)


# ----------------------------
# MAIN (spawns listener + menu)
# ----------------------------
def main():
    ser = open_serial()

    # Start background thread for listening
    listener_thread = threading.Thread(target=listen_serial, args=(ser,), daemon=True)
    listener_thread.start()

    print("\n=== ESP32 UART CONTROL MENU ===")
    print("Type one of the following commands:")
    print("  d → send DND (set RED)")
    print("  c → send CLEAN (set GREEN)")
    print("  q → quit\n")

    # ---- Main command loop ----
    while True:
        cmd = input("Command: ").strip().lower()

        if cmd == "d":
            send_dnd(ser)

        elif cmd == "c":
            send_clean(ser)

        elif cmd == "q":
            print("Exiting…")
            break

        else:
            print("Invalid command. Use: d, c, or q.")


if __name__ == "__main__":
    main()
