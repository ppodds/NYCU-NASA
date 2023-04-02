# Resolver

## resolver

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
zone "nasa" {
	type forward;
	forward first;
	forwarders {
		192.168.254.3;
	};
};

zone "168.192.in-addr.arpa" {
	type forward;
	forward first;
	forwarders {
		192.168.254.3;
	};
};

zone "113.10.in-addr.arpa" {
	type forward;
	forward first;
	forwarders {
		192.168.254.3;
	};
};


```

設定 forwarders 跟 DNSSEC

```shell
sudo vim /etc/bind/named.conf.options
```

```conf
dnssec-validation yes;
empty-zones-enable no;

// 放到 fowarder block 裡面
1.1.1.1;
```

## ns1 DNSSEC

````shell
# KSK (49094)
sudo dnssec-keygen -f KSK -a 13 26.nasa
# ZSK (33525)
sudo dnssec-keygen -a 13 26.nasa
``

這兩把的公鑰要加到 26.nasa 的 zone file 裡面

```shell
sudo vim /etc/bind/26.nasa.hosts
````

```conf
$INCLUDE "/etc/bind/K26.nasa.+013+49094.key"
$INCLUDE "/etc/bind/K26.nasa.+013+33525.key"
```

生成簽章

```shell
sudo dnssec-signzone -g -o 26.nasa -k K26.nasa.+013+49094.key 26.nasa.hosts K26.nasa.+013+33525.key
```

生出的檔案會是 26.nasa.hosts.signed，要把它換成現在用的 zone file

```shell
sudo vim /etc/bind/zones.nasa
```

直接改掉檔案就好

```conf
zone "26.nasa" {
	type master;
	file "/etc/bind/26.nasa.hosts.signed";
};
```

DS record 會放在 dsset-26.nasa. 裡面，最後一段文字中間的空格在上傳前要先刪掉

reverse zone 也需要新增 DS record，如法炮製

## DoH

下載 [doh proxy](https://github.com/DNSCrypt/doh-server) 以後直接執行

fullchain.pem 跟 privkey.pem 是 OJ 給的憑證檔案

```shell
sudo doh-proxy -i /home/ppodds/fullchain.pem -I /home/ppodds/privkey.pem -H dns.26.nasa -l 0.0.0.0:443 -u 127.0.0.1:53
```

## DoT

從 bind 直接改設定

```shell
sudo vim /etc/bind/named.conf.local
```

```conf
tls local-tls {
	key-file "/etc/bind/privkey.pem";
    cert-file "/etc/bind/fullchain.pem";
};
```

憑證檔案的權限要設成 root:bind 660，而且不能同時有人在讀取。

```shell
sudo vim /etc/bind/named.conf.options
```

```conf
listen-on { any; };
listen-on port 853 tls local-tls { any; };
```
