Files in this folder should be placed in /etc/

Add the following lines to /etc/rc.conf:

```
rpcbind_enable="YES"
nfs_server_enable="YES"
nfsv4_server_enable="YES"
mountd_flags="-r -p 87"
```

Add the following lines to /etc/sysctl.conf:

```
vfs.nfsd.server_min_nfsvers=4
```
