#!/bin/sh

if [ $# -eq 0 ] # in case of no arguments, print usage
  then
    echo "Usage : nomoreblanks.sh <file>"
else

touch $1.copy
cat $1 | sed -E "s/[[:blank:]]*$//g" >> $1.copy
rm $1
mv $1.copy $1

fi
