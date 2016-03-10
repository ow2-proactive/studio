#!/bin/bash
# This script needs following packages installed x11-apps and netpbm.
# The screenshots are limited to 100K, which is around 10gb of screenshots.
# Use export DISPLAY=:99 to capture screenshots from display 99.
for i in {1..100000}
do
    xwd -root -silent | xwdtopnm |pnmtojpeg > "test/ui/reports/screen$i.jpg"
   echo "Took screenshot number: $i"
   sleep 0.1s
done
