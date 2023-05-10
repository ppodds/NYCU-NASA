# Mail Server

## DNS

```shell
sudo vim /etc/bind/26.nasa.hosts
```

加入 MX record

```conf
    IN  MX  10  mail.26.nasa.
mail    IN  A   10.113.26.25
```

反解

```shell
sudo vim /etc/bind/26.113.10.rev
```

```conf
25.26.113.10.in-addr.arpa.  IN  PTR mail.26.nasa.
```

沒簽 DNSSEC 會爛掉，記得要簽

## 改 DHCP 的 DNS resolver

需要把 resolver 換成助教的，不然抓不到主機

```shell
sudo vim /etc/dhcp/dhcpd.conf
```

```conf
option domain-name-servers 192.168.254.153;
```

## Postfix

```shell
sudo apt install postfix
```

```shell
sudo vim /etc/postfix/main.cf
```

```conf
myhostname = mail.26.nasa
mydestination = $myhostname, mail, localhost.localdomain, , localhost, 26.nasa
```

## STARTLS

```shell
sudo vim /etc/postfix/main.cf
```

mail.pem 和 mail.key 是 OJ 那邊拿到以後放進去的，之後所有 TLS 都跟他共用證書

```conf
smtpd_tls_cert_file=/etc/ssl/certs/mail.pem
smtpd_tls_key_file=/etc/ssl/private/mail.key
```

設好可以用這個指令試試看

```shell
openssl s_client -connect 192.168.26.25:25 -starttls smtp
```

## IMAP / SASL

```shell
sudo apt-get install dovecot-imapd
```

```shell
sudo vim /etc/dovecot/conf.d/10-master.conf
```

把原本給的設定解註解就可以了

```conf
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
  }
}
```

```shell
sudo vim /etc/dovecot/conf.d/10-ssl.conf
```

```conf
ssl_cert = </etc/ssl/certs/mail.pem
ssl_key = </etc/ssl/private/mail.key
```

```shell
sudo vim /etc/dovecot/conf.d/10-auth.conf
```

加入 login 的認證機制

```conf
auth_mechanisms = plain login
```

```shell
sudo vim /etc/postfix/main.cf
```

照著官網改就好

```conf
smtpd_sasl_type = dovecot

# Can be an absolute path, or relative to $queue_directory
# Debian/Ubuntu users: Postfix is setup by default to run chrooted, so it is best to leave it as-is below
smtpd_sasl_path = private/auth

# and the common settings to enable SASL:
smtpd_sasl_auth_enable = yes

smtpd_sender_restrictions =
        reject_unauthenticated_sender_login_mismatch
        reject_authenticated_sender_login_mismatch
        reject_unlisted_sender
        check_sender_access hash:/etc/postfix/sender_access
smtpd_sender_login_maps = hash:/etc/postfix/login_maps
smtpd_recipient_restrictions =
        reject_unknown_recipient_domain
        check_policy_service inet:127.0.0.1:10023
smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
```

```shell
sudo vim /etc/postfix/login_maps
```

```conf
ppodds  ppodds
TA      ta
cool-TA cool-ta
```

```shell
sudo postmap /etc/postfix/sender_access
```

```shell
sudo vim /etc/postfix/sender_access
```

```conf
<>  REJECT
```

```shell
sudo postmap /etc/postfix/sender_access
```

重啟以後應該會動，要記得先把 ta 和 cool-ta 的帳號設好

## Aliases

沒裝這個會不能用 PCRE

```shell
sudo apt install postfix-pcre
```

```shell
sudo vim /etc/postfix/main.cf
```

```conf
alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases
virtual_alias_maps = pcre:/etc/postfix/virtual
```

```shell
sudo vim /etc/alises
```

```conf
postmaster:    root
nasata:    ta
TA:     ta
cool-TA:        cool-ta
```

```shell
sudo postalises /etc/aliases
```

```shell
sudo vim /etc/postfix/virtual
```

```conf
/^[\w-]*\|([\w-]+)@([\.\w-]+)$/ $1@$2
```

## Greylist

```shell
sudo apt install postgrey
```

workaround for pipe aliases

```shell
sudo vim /etc/postgrey/whitelist_recipients.local
```

```conf
/^[\w-]*\|[\w-]*@(mail.)?26.nasa$/
```

```shell
sudo /etc/default/postgrey
```

```conf
POSTGREY_OPTS="--inet=10023 --delay=30"
```

## Rewrite

```shell
sudo vim /etc/postfix/main.cf
```

```conf
smtp_generic_maps = pcre:/etc/postfix/generic_maps
masquerade_domains = 26.nasa
```

```shell
sudo vim /etc/postfix/generic_maps
```

```conf
/^([\w-]*)@mail.26.nasa$/ $1@26.nasa
/^cool-TA@([\w-.]*)$/ notcool-TA@$1
```

## Spam Detection and Virus Scanning

```shell
sudo apt install spamassassin amavis clamav-daemon
```

要給他 amavis clamav group 的權限才能去存取 socket

```shell
sudo usermod amavis -aG clamav
```

```shell
sudo vim /etc/amavis/conf.d/05-node_id
```

```conf
$myhostname = "mail.26.nasa";
```

```shell
sudo vim /etc/amavis/conf.d/15-content_filter_mode
```

```conf
@bypass_virus_checks_maps = (
   \%bypass_virus_checks, \@bypass_virus_checks_acl, \$bypass_virus_checks_re);

@bypass_spam_checks_maps = (
   \%bypass_spam_checks, \@bypass_spam_checks_acl, \$bypass_spam_checks_re);
```

```shell
sudo vim /etc/amavis/conf.d/50-user
```

```conf
$forward_method = 'smtp:127.0.0.1:10025';
$sa_spam_subject_tag = '*** SPAM ***';
$sa_kill_level_deflt = 1300.0;
$final_virus_destiny      = D_PASS;  # (data not lost, see virus quarantine)
$final_banned_destiny     = D_PASS;
$subject_tag_maps_by_ccat{+CC_VIRUS} = [ '*** SPAM ***' ];
```

```shell
sudo vim /eetc/spamassassin/local.cf
```

```conf
rewrite_header Subject *** SPAM ***
```

把 amavis 加到 postfix 的 service 底下

```shell
sudo vim /etc/postfix/master.cf
```

```conf
smtp-amavis     unix    -       -       n       -       10      smtp
        -o smtp_data_done_timeout=1200s
        -o smtp_never_send_ehlo=yes
        -o notify_classes=protocol,resource,software
127.0.0.1:10025 inet    n       -       n       -       -       smtpd
        -o content_filter=
        -o mynetworks=127.0.0.0/8
        -o local_recipient_maps=
        -o notify_classes=protocol,resource,software
        -o myhostname=localhost
        -o smtpd_client_restrictions=
        -o smtpd_sender_restrictions=
        -o smtpd_recipient_restrictions=permit_mynetworks,reject
        -o smtpd_tls_security_level=
```

## Outgoing filter

```shell
sudo vim /etc/postfix/main.cf
```

```conf
header_checks = pcre:/etc/postfix/header_checks
```

```shell
sudo vim /etc/postfix/header_checks
```

```conf
/^(?i)SUBJECT(?-i):.*(NCTU|陽交|=\?UTF-8\?B\?6Zm95Lqk\?=).*$/   REJECT
```

## DMARC / SPF

到 DNS 上加 TXT

```shell
sudo vim /etc/bind/26.nasa.hosts
```

```conf
  IN      TXT     "v=spf1 a mx -all"
_dmarc  IN      TXT     "v=DMARC1;p=reject"
```

記得重簽 DNSSec

```shell
sudo systemctl restart bind9
```
