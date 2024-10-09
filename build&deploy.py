import getpass
import time

import paramiko


def print_colored(skk):
    print("\033[96m {}\033[00m".format(skk))


# Chiedi all'utente le credenziali SSH
hostname = "lily.cs.unibo.it"
try:
    with open(".secrets", "r") as f:
        lines = [line.strip() for line in f]
        username = lines[0]
        password = lines[1]
except FileNotFoundError:
    username = input("Nome utente del tuo account unibo: ")
    password = getpass.getpass("Inserisci la password SSH: ")


# Crea un client SSH
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # Connessione SSH
    client.connect(hostname, username=username, password=password)
    print_colored(f"Connessione riuscita a {hostname}.")

    # Ottieni un canale per eseguire comandi interattivi
    channel = client.invoke_shell()

    # Esegui il comando "cd" per cambiare directory
    channel.send("cd /home/web/site232433/html\n")
    time.sleep(1)
    output = channel.recv(1024).decode()
    print(output)

    # Chiedi all'utente la passphrase prima di eseguire "git pull"
    passphrase = getpass.getpass("Inserisci la passphrase per git: ")

    # Esegui "git pull"
    channel.send(f"git pull\n")
    time.sleep(1)

    # Invia la passphrase per git
    channel.send(f"{passphrase}\n")
    time.sleep(2)  # Attendi che il comando venga eseguito
    output = channel.recv(2048).decode()
    print(output)

    # Esegui "npm run build" con gestione continua dell'output
    print_colored("\nEseguo: npm run build")
    channel.send("/usr/local/node/bin/npm run build\n")
    time.sleep(10)

finally:
    # Chiudi la connessione SSH
    channel.close()
    client.close()
    print_colored("Connessione SSH chiusa.")
