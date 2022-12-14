#!/bin/sh
file_name=$(basename $1)
file_ext=${file_name##*.}

echo $file_ext

if [ "$file_ext" = "exe" ] ; then
	mv $1 /home/ftp/hidden/.exe/
	timestamp=$(date "+%a %d %T")
	hostname=$(hostname)
	prog_name="$UPLOAD_USER[$$]"
	log="$timestamp $hostname $prog_name: $1 violate file detected. Uploaded by $UPLOAD_VUSER."
	echo "$log" >> /home/ftp/public/pureftpd.viofile
fi
