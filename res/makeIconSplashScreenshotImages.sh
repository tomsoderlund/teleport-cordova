#!/usr/bin/env bash

# App image assets - instructions for designers:
# * Icon: 1536x1536px, PNG, 24-bit, not transparent background
# * Splash: 2208x2208px, PNG, 24-bit, not transparent background, keep important content within a centered 1242x1242px rectangle
# * Screenshots: TBD

# mogrify:
#	-depth 8 -scale = scale to fit
# 	-thumbnail = scale with cropping
# 	-extent
# 	-gravity
# http://stackoverflow.com/questions/12222839/in-imagemagick-how-can-i-scale-an-image-down-just-enough-so-its-cropped-to-par


# ----- Initialize -----

# Run this from app root directory
cd ./res

format="png"


# ----- Icon -----

echo
echo "Making icons..."
echo

folder=icon
mkdir $folder
cd $folder

# Android
source="icon_android.png"
folder=android
mkdir $folder
cp $source icon.png
array=("36x36" "48x48" "72x72" "96x96" "144x144" "192x192" "512x512")
for resolution in "${array[@]}"; do
	echo "Creating $source for $folder in $resolution..."
	mogrify -format $format -depth 8 -scale $resolution -extent $resolution -gravity center -format "$resolution.png" -path "./$folder" "icon.png"
done

# iOS
source="icon_ios.png"
folder=ios
mkdir $folder
cp $source icon.png
array=("20x20" "29x29" "40x40" "57x57" "58x58" "60x60" "76x76" "80x80" "87x87" "114x114" "120x120" "152x152" "167x167" "180x180" "228x228" "1024x1024")
for resolution in "${array[@]}"; do
	echo "Creating $source for $folder in $resolution..."
	mogrify -format $format -depth 8 -scale $resolution -extent $resolution -gravity center -format "$resolution.png" -path "./$folder" "icon.png"
done

rm icon.png
cd ..


# ----- Splash images -----

echo
echo "Making splash images..."
echo

folder=splash
mkdir $folder
cd $folder

source="splash.png"

# Android
folder=android
mkdir $folder
array=("200x320" "320x200" "320x480" "480x320" "480x800" "800x480" "720x1280" "1280x720" "960x1600" "1600x960" "1280x1920" "1920x1280")
for resolution in "${array[@]}"; do
	echo "Creating $source for $folder in $resolution..."
	mogrify -format $format -depth 8 -scale $resolution -extent $resolution -gravity center -format "$resolution.png" -path "./$folder" "$source"
done

# iOS
folder=ios
mkdir $folder
array=("320x480" "480x320" "640x1136" "640x960" "750x1334" "768x1024" "960x640" "1024x768" "1080x1920" "1136x640" "1334x750" "1536x2048" "1920x1080" "2048x1536" "1280x1920" "1920x1280" "768x1004" "1536x2008" "1024x748" "2048x1496" "1242x2208" "2208x1242")
for resolution in "${array[@]}"; do
	echo "Creating $source for $folder in $resolution..."
	mogrify -format $format -depth 8 -scale $resolution -extent $resolution -gravity center -format "$resolution.png" -path "./$folder" "$source"
done

cd ..


# ----- Done -----

cd ..

echo
echo "Done!"
echo