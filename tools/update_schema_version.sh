#!/bin/bash

if [ $# -ne 3 ] ; then
    echo "ERROR: expect 3 parameters"
    echo "Usage:"
    echo "    "$0"  <path_to_search> <original_version> <new_version>"
    echo "Example:"
    echo "    "$0" 3.9 3.10 .."
    exit 1
fi

grep_cmd="grep -lR \"jobdescriptor[\:/]$2\" $1"
echo "EXECUTING:"
echo "          "$grep_cmd

eval $grep_cmd | while read file ; do
    sed_cmd="sed -i -e 's,jobdescriptor\([:/]\)$2,jobdescriptor\1$3,g' $file"
    echo "EXECUTING:"
    echo "          "$sed_cmd
    eval $sed_cmd
done
