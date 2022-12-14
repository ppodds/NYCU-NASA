#!/bin/sh

usage="hw2.sh -i INPUT -o OUTPUT [-c csv|tsv] [-j]

Available Options:

-i: Input file to be decoded
-o: Output directory
-c csv|tsv: Output files.[ct]sv
-j: Output info.json"

usage() {
    echo "$usage" >&2
    exit 1
}

# read the options
while getopts ":i:o:c:j" op ; do
    case $op in
        i)
            input="$OPTARG"
        ;;
        o)
            output="$OPTARG"
        ;;
        c)
            if [ "$OPTARG" = "csv" ] || [ "$OPTARG" = "tsv" ] ; then
                output_format="$OPTARG"
            else
                usage
            fi
        ;;
        j)
            output_info=0
        ;;
        ?)
            usage
        ;;
    esac
done

# check if input and output are given
if [ -z "$input" ] || [ -z "$output" ] ; then
    usage
fi

# check if input file is readable and exists
if [ ! -r "$input" ] ; then
    usage
fi

# create output directory is not exists
if [ ! -d "$output" ] ; then
    mkdir -p "$output"
fi

# set default output_info
if [ -z "$output_info" ] ; then
    output_info=1
fi

invalid_file_count=0
counter=0
file=$(jq .files["$counter"] < "$input")
if [ "$output_format" = "tsv" ] ; then 
    sep="\t"
else
    sep=","
fi

if [ ! -z "$output_format" ] ; then
    printf "filename${sep}size${sep}md5${sep}sha1\n" > "$output"/files."$output_format"
fi

while [ "$file" != "null" ] ; do
    filename=$(echo "$file" | jq -r .name)
    mkdir -p "$output"/"$(gdirname "$filename")"
    # generate file
    echo "$file" | jq -r .data | base64 -d > "$output"/"$filename"
    # generate file info
    md5=$(echo "$file" | jq -r .hash.md5)
    sha1=$(echo "$file" | jq -r '.hash."sha-1"')
    size=$(gdu -b "$output"/"$filename" | cut -f 1)
    if [ ! -z "$output_format" ] ; then
        printf "${filename}${sep}${size}${sep}${md5}${sep}${sha1}\n" >> "$output"/files."$output_format"
    fi
    true_md5=$(md5sum "$output"/"$filename" | cut -d ' ' -f 1)
    true_sha1=$(sha1sum "$output"/"$filename" | cut -d ' ' -f 1)
    if [ "$md5" != "$true_md5" ] || [ "$sha1" != "$true_sha1" ] ; then
	invalid_file_count=$((invalid_file_count+1))
    fi
    # next file
    counter=$((counter+1))
    file=$(jq .files["$counter"] < "$input")
done

# generate info.json
if [ "$output_info" -eq 0 ] ; then
    date_s=$(jq .date < "$input")
    formatted_date=$(gdate -d @"$date_s" -Isecond)
    jq '{name,author,date}|.date=$date' --arg date "$formatted_date" < "$input" > "$output"/info.json
fi

# return invalid file count
return "$invalid_file_count"
