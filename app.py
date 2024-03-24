import logging
import requests
import sys
import random
from datetime import datetime, timedelta
import string
import secrets
sys.stdout.reconfigure(encoding='utf-8')

# 设置必要值
API = "http://YourIp:23333/api"
APIKEY = "YourApiKey"
REMOTE_UUID = "YourDaemonId"
headers = {"X-Requested-With": "XmlHttpRequest", "Content-Type": "application/json; charset=utf-8"}

# 设置日志记录器
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 设置 Formatter 格式
formatter = logging.Formatter('[%(asctime)s][%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

# 设置控制台处理器并应用 Formatter
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

alphabet = string.ascii_letters + string.digits  # A-Z、a-z和0-9
username_length = secrets.choice(range(6, 13))  # 随机用户长度为6到12
username = ''.join(secrets.choice(alphabet) for i in range(username_length))  # 生成随机用户
# logging.info(f"生成的用户名为：{username}")

password_length = secrets.choice(range(15, 20))  # 随机密码长度为9到36
password = ''.join(secrets.choice(alphabet) for i in range(password_length))  # 生成随机密码

add_user = {
    "username": username,
    "password": password,
    "permission": 1
}
# print(add_user)
add_user_r = requests.post(f"{API}/auth?apikey={APIKEY}", headers=headers, json=add_user)
# print(add_user_r.json())
if add_user_r.json()['status'] != 200:
    logging.error(add_user_r.json().get('data'))
    sys.exit(0)

# 获取用户uuid
user_r = requests.get(f"{API}/auth/search?userName={username}&apikey={APIKEY}&page=1&page_size=2", headers=headers)
# print(user_r.json())
if user_r.status_code != 200:
    logging.error(user_r.json().get('data'))
    sys.exit(0)

user_data = user_r.json().get('data').get('data')[0]
user_uuid = user_data['uuid']
user_permission = user_data['permission']

# 创建实例
instance_name = f"TYubuntu{round(random.uniform(0,100000))}"
# 获取当前时间并加上1个月
now = datetime.now()
one_month_later = now + timedelta(days=30)

# 将日期格式化为 yyyy/mm/dd 格式的字符串
formatted_date = one_month_later.strftime('%Y/%m/%d')
instance_data = {
    "nickname": instance_name,
    "startCommand": "bash",
    "stopCommand": "^c",
    "cwd": ".",
    "ie": "UTF8",
    "oe": "UTF8",
    "createDatetime": "2024/2/1",
    "lastDatetime": "--",
    "type": "universal",
    "tag": [],
    "endTime": formatted_date,
    "fileCode": "UTF8",
    "processType": "docker",
    "updateCommand": "echo '若需要定制更新内容，请找YourQQ修改'",
    "crlf": 2,
    "actionCommandList": [],
    "terminalOption": {
        "haveColor": False,
        "pty": True,
        "ptyWindowCol": 140,
        "ptyWindowRow": 40
    },
    "eventTask": {
        "autoStart": False,
        "autoRestart": False,
        "ignore": False
    },
    "docker": {
        "containerName": "",
        "image": "ubuntu:22.04",
        "ports": [],
        "extraVolumes": [],
        "memory": "512",
        "networkMode": "host",
        "networkAliases": [],
        "cpusetCpus": "0",
        "cpuUsage": "100",
        "maxSpace": None,
        "io": None,
        "network": None
    },
    "pingConfig": {
        "ip": "",
        "port": 25565,
        "type": 1
    },
    "extraServiceConfig": {
        "openFrpTunnelId": "",
        "openFrpToken": ""
    }
}
instance_r = requests.post(f"{API}/instance?remote_uuid={REMOTE_UUID}&apikey={APIKEY}", headers=headers, json=instance_data)
# print(instance_r.json())
if instance_r.status_code != 200:
    logging.error(instance_r.json().get('data'))
    sys.exit(0)


instance_uuid = instance_r.json().get('data').get('instanceUuid')

# 更新用户数值
user_instance_data = {
  "uuid": user_uuid,
  "config": {
    "uuid": user_uuid,
    "userName": username,
    "loginTime": "",
    "instances": [
      {
        "instanceUuid": instance_uuid,
        "serviceUuid": REMOTE_UUID,
        "nickname": instance_name,
        "status": "未运行",
        "hostIp": "localhost:24444"
      }
    ],
    "permission": user_permission,
    "apiKey": "",
    "isInit": False
  }
}
# print(user_instance_data)
update_user_r = requests.put(f"{API}/auth?apikey={APIKEY}", headers=headers, json=user_instance_data)
# print(update_user_r.json())
if update_user_r.status_code != 200:
    logging.error(update_user_r.json().get('data'))
    sys.exit(0)

print(f"用户创建完毕，用户名：{username}，密码:{password}，实例名：{instance_name}",end="")
