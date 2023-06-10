# HW4

## DNS / DHCP

照之前的方式先設定好 ip 跟 dns

ldap server: 192.168.26.10
work station: 192.168.26.50

## TLS

把 private key 和證書載下來放好，之後建下面檔案

```shell
vim certinfo.ldif
```

```
dn: cn=config
changetype: modify
add: olcTLSCACertificateFile
olcTLSCACertificateFile: /etc/ssl/certs/ca-certificates.crt
-
dn: cn=config
add: olcTLSCertificateFile
olcTLSCertificateFile: /etc/ldap/cert.pem
-
dn: cn=config
add: olcTLSCertificateKeyFile
olcTLSCertificateKeyFile: /etc/ldap/privkey.pem
```

```shell
ldapmodify -Y EXTERNAL -H ldapi:/// -f certinfo.ldif
```

關掉非 TLS 的服務

```shell
sudo vim /etc/default/slapd
```

```
SLAPD_SERVICES="ldaps:/// ldapi:///"
```

### 新增 dc

```shell
vim add_dc.ldif
```

```
dn: dc=26,dc=nasa
objectClass: top
objectClass: dcObject
objectClass: domain
```

```shell
ldapadd -x -H ldap:/// -D cn=Manager,dc=26,dc=nasa -w <password> -f add_dc.ldif
```

### 新增 ou

```shell
vim add_ou.ldif
```

```
dn: ou=People,dc=26,dc=nasa
objectClass: top
objectClass: organizationalUnit
ou: People

dn: ou=Group,dc=26,dc=nasa
objectClass: top
objectClass: organizationalUnit
ou: Group

dn: ou=MemberGroup,dc=26,dc=nasa
objectClass: top
objectClass: organizationalUnit
ou: MemberGroup

dn: ou=Ppolicy,dc=26,dc=nasa
objectClass: top
objectClass: organizationalUnit
ou: Ppolicy

dn: ou=SUDOers,dc=26,dc=nasa
objectClass: top
objectClass: organizationalUnit
ou: SUDOers
```

```shell
ldapadd -x -H ldap:/// -D cn=Manager,dc=26,dc=nasa -w <password> -f add_ou.ldif
```

### Add Schema

```shell
sudo apt install schema2ldif sudo-ldap
```

```shell
sudo cp /usr/share/doc/sudo-ldap/schema.OpenLDAP /etc/ldap/schema/
sudo schema2ldif /etc/ldap/schema/schema.OpenLDAP > /etc/ldap/schema/OpenLDAP.ldif
sudo ldapmodify -Y EXTERNAL -H ldapi:/// -f /etc/ldap/schema/OpenLDAP.ldif
```

```shell
sudo vim ssh.ldif
```

```
dn: cn=openssh-lpk,cn=schema,cn=config
objectClass: olcSchemaConfig
cn: openssh-lpk
olcAttributeTypes: ( 1.3.6.1.4.1.24552.500.1.1.1.13 NAME 'sshPublicKey'
    DESC 'MANDATORY: OpenSSH Public key'
    EQUALITY octetStringMatch
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.40 )
olcObjectClasses: ( 1.3.6.1.4.1.24552.500.1.1.2.0 NAME 'ldapPublicKey' SUP top AUXILIARY
    DESC 'MANDATORY: OpenSSH LPK objectclass'
    MAY ( sshPublicKey $ uid )
    )
```

```shell
sudo ldapadd -Y EXTERNAL -H ldapi:/// -f ssh.ldif
```

### Group

```shell
vim add_group.ldif
```

```
dn: cn=ta,ou=Group,dc=26,dc=nasa
objectClass: top
objectClass: posixGroup
cn: ta
gidNumber: 10000

dn: cn=stu,ou=Group,dc=26,dc=nasa
objectClass: top
objectClass: posixGroup
cn: stu
gidNumber: 20000
```

```shell
ldapadd -x -H ldaps:/// -D cn=Manager,dc=26,dc=nasa -w <password> -f add_group.ldif
```

```shell
vim add_user.ldif
```

```
dn: uid=generalta,ou=People,dc=26,dc=nasa
objectClass: top
objectClass: account
objectClass: posixAccount
objectClass: ldapPublicKey
cn: generalta
uid: generalta
uidNumber: 10000
gidNumber: 10000
homeDirectory: /home/generalta
userPassword: {SSHA}Z3BZ7AMDL8uQ5U2Hu1IS6o/+1/GQdOid
sshPublicKey: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPedeG/ZoQUNLqbMn+1b303DjJWLtuXXb8chEv6KBTGm 2023-na-hw4

dn: uid=securityta,ou=People,dc=26,dc=nasa
objectClass: top
objectClass: account
objectClass: posixAccount
cn: securityta
uid: securityta
uidNumber: 10001
gidNumber: 10000
homeDirectory: /home/securityta
userPassword: {SSHA}Z3BZ7AMDL8uQ5U2Hu1IS6o/+1/GQdOid

dn: uid=stu26,ou=People,dc=26,dc=nasa
objectClass: top
objectClass: account
objectClass: posixAccount
cn: stu26
uid: stu26
uidNumber: 20026
gidNumber: 20000
homeDirectory: /home/stu26
userPassword: {SSHA}Z3BZ7AMDL8uQ5U2Hu1IS6o/+1/GQdOid
```

```shell
ldapadd -x -H ldap:/// -D cn=Manager,dc=26,dc=nasa -w <password> -f add_user.ldif
```

### SUDOers

```shell
vim add_sudoers.ldif
```

```
dn: cn=ta,ou=SUDOers,dc=26,dc=nasa
objectClass: top
objectClass: sudoRole
cn: ta
sudoUser: %ta
sudoHost: ALL
sudoRunAsUser: ALL
sudoRunAsGroup: ALL
sudoCommand: ALL

dn: cn=stu,ou=SUDOers,dc=26,dc=nasa
objectClass: top
objectClass: sudoRole
cn: stu
sudoUser: %stu
sudoHost: ALL
sudoRunAsUser: ALL
sudoRunAsGroup: ALL
sudoCommand: /usr/bin/ls
```

### ssh login

```shell
sudo vim /etc/ssh/script.sh
```

```shell
#!/bin/sh
ldapsearch -x -H ldaps://ldap.26.nasa '(&(objectClass=posixAccount)(uid='"$1"'))' 'sshPublicKey' | sed -n '/^ /{H;d};/sshPublicKey:/x;$g;s/\n *//g;s/sshPublicKey: //gp'
```

```shell
chmod 500 /etc/ssh/script.sh
```

```shell
sudo vim /etc/ssh/sshd_config
```

```
AuthorizedKeysCommand /etc/ssh/script.sh
AuthorizedKeysCommandUser root
```
