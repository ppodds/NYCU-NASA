## Router

用 ubuntu server 22.04 LTS
在 virtual box 上給兩張網卡，一張是原本的 NAT，另一張是內部網路。
內網 IP 設定為 192.168.26.254

### 網卡設定 (netplan)

```shell
sudo vim /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses: [192.168.26.254/24]
  version: 2
```

一開始 virtual box 給的第一張網卡是 NAT，對應到這裡的 enp0s3，第二張網卡是內部網路，對應到這裡的 enp0s8。由於這台主機要兼 DHCP server，所以 IP 手動指定成 `192.168.26.254/24`。

> 如果是要查網卡資訊可以用 `ip a` 來查看。

套用更動

```shell
sudo netplan apply
```

### 開啟 IP 轉發

```shell
sudo vim /etc/sysctl.conf
```

改這行就好

```conf
net.ipv4.ip_forward=1
```

套用更動

```shell
sudo sysctl -p
```

### NAT

用 iptables 就可以做出 NAT 的效果

```shell
iptables -t nat -I POSTROUTING -j MASQUERADE
```

轉送 VPN 的封包

```shell
iptables -A FORWARD -i wg0 -o enp0s8 -j ACCEPT
```

但是 iptables 重開機就會消失，所以要用 `iptables-persistent` 來儲存設定

```shell
sudo apt install iptables-persistent
sudo -i
iptables-save > /etc/iptables/rules.v4
exit
```

之後存在 `/etc/iptables/rules.v4` 的設定就會在重開機時自動套用。

### DHCP Server

先安裝 DHCP server 並調整需要用到的設定

```shell
sudo apt install isc-dhcp-server
sudo vim /etc/dhcp/dhcpd.conf
```

調整需要用到的設定

```conf
option domain-name "nasa";
option domain-name-servers 8.8.8.8, 4.4.4.4;

subnet 192.168.26.0 netmask 255.255.255.0 {
  range 192.168.26.1 192.168.26.253;
  option routers 192.168.26.254;
  option broadcast-address 192.168.26.255;
}

host agent {
  hardware ethernet 08:00:27:e7:91:7a;
  fixed-address 192.168.26.123;
}
```

另外要指定預設要監聽 dhcp 的網路介面

```shell
sudo vim /etc/default/isc-dhcp-server
```

```
INTERFACESv4="eth4"
```

client 預設應該都會使用 DHCP，所以就不用特別設定了。

### Firewall

只要擋 VPN 連到 router 的 ssh 就好，其他內網主機都可以用 NAT 擋

```shell
sudo iptables -D INPUT -p tcp -s 10.113.26.0/24 -d 10.113.26.1 --dport 22 -j DROP
```

## Reference

[Ubuntu Server DHCP](https://ubuntu.com/server/docs/network-dhcp)
