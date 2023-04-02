# Authoritative DNS Server

## 設定 ns1 和 dns 的 IP

連進 router 並固定 DHCP 發給他們的 IP

```shell
sudo vim /etc/dhcp/dhcpd.conf
```

```conf
host ns1 {
    hardware ethernet 08:00:27:6f:da:f4;
    fixed-address 192.168.26.53;
}

host dns {
    hardware ethernet 08:00:27:f3:e7:ac;
    fixed-address 192.168.26.153;
}
```

## bind 設定

先裝 bind 以後把題目要求的設定寫上

```shell
sudo apt install bind9
```

```shell
sudo vim /etc/bind/named.conf.local
```

加入 zone 檔案

```conf
include "/etc/bind/zones.nasa";
```

寫 zone 的設定

```shell
sudo vim /etc/bind/zones.nasa
```

```conf
zone "26.nasa" {
	type master;
	file "/etc/bind/26.nasa.hosts";
};
zone "26.168.192.in-addr.arpa" {
	type master;
	file "/etc/bind/26.168.192.rev";
};
zone "26.113.10.in-addr.arpa" {
	type master;
	file "/etc/bind/26.113.10.rev";
};
```

編輯 zone 的正向紀錄

```shell
sudo vim /etc/bind/26.nasa.hosts
```

```conf
$ttl 38400
$ORIGIN 26.nasa.
@	IN	SOA	ns1.26.nasa. root.26.nasa. (
			2023032501
			604800
			86400
			2419200
			86400 )
	IN	NS 	ns1.26.nasa.
whoami	IN	A	10.113.26.1
dns 	IN	A	192.168.26.153
ns1 	IN	A	192.168.26.53
```

192.168.26 底下的反向紀錄

```shell
sudo vim /etc/bind/26.168.192.rev
```

```conf
$ttl 38400
26.168.192.in-addr.arpa.	IN	SOA	ns1.26.nasa. root.26.nasa. (
			2023032501
			604800
			86400
			2419200
			86400 )
26.168.192.in-addr.arpa.	IN	NS	ns1.26.nasa.
153.26.168.192.in-addr.arpa.	IN	PTR	dns.26.nasa.
53.26.168.192.in-addr.arpa.	IN	PTR	ns1.26.nasa.
```

10.113.26 底下的反向紀錄

```shell
sudo vim /etc/bind/26.113.10.rev
```

```conf
$ttl 38400
26.113.10.in-addr.arpa.	IN	SOA	ns1.26.nasa. root.26.nasa. (
			2023032603
			604800
			86400
			2419200
			86400 )
26.113.10.in-addr.arpa.	IN	NS	ns1.26.nasa.
1.26.113.10.in-addr.arpa.	IN	PTR	whoami.26.nasa.
```

最後記得關掉遞迴解析

```shell
sudo vim /etc/bind/named.conf.options
```

```conf
// 加在 options block 裡面
recursion no;
```
