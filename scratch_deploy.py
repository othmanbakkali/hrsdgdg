import paramiko
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

hostname = "198.199.75.86"
user = "root"
password = "lOnohi_1989$tm"
remote_base = "/var/www/hrsdgdg"

print(f"Connecting to {user}@{hostname}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, port=22, username=user, password=password, timeout=15)
print("Connected!")

sftp = client.open_sftp()

def ensure_remote_dir(remote_dir):
    dirs = remote_dir.strip('/').split('/')
    current = ""
    for d in dirs:
        current += "/" + d
        try:
            sftp.stat(current)
        except IOError:
            try:
                sftp.mkdir(current)
            except Exception:
                pass

def upload_directory(local_dir, remote_dir):
    ensure_remote_dir(remote_dir)
    for root, dirs, files in os.walk(local_dir):
        rel_root = os.path.relpath(root, local_dir).replace('\\', '/')
        if rel_root == '.':
            target_dir = remote_dir
        else:
            target_dir = f"{remote_dir}/{rel_root}"
            ensure_remote_dir(target_dir)
        
        for file in files:
            local_file = os.path.join(root, file)
            target_file = f"{target_dir}/{file}".replace('\\', '/')
            print(f"  Uploading {local_file} -> {target_file}")
            sftp.put(local_file, target_file)

# Upload oria-admin/dist
print("\n=== UPLOADING ADMIN DIST ===")
upload_directory("oria-admin/dist", f"{remote_base}/oria-admin/dist")

sftp.close()

# Reload Nginx
print("\n=== RELOADING NGINX ===")
stdin, stdout, stderr = client.exec_command("systemctl reload nginx")
print("STDOUT: " + stdout.read().decode('utf-8', errors='ignore'))

client.close()
print("\n✅ ADMIN DEPLOYMENT COMPLETED SUCCESSFULLY!")
