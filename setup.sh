#!/bin/bash
echo "Run as an unprived user with sudo access! I will not be checking this..."
read -p "Press Enter to continue"
sudo pacman -S npm bower
cd LampProject
sudo npm install
sudo npm install -g cordova
sudo npm install -g ember-cli
sudo ember install ember-cordova
sudo ember cdv:platform add android
sudo ember cdv:plugin add cordova-plugin-device-motion
sudo ember install ember-charts

sudo ember cdv:plugin add https://github.com/mbientlab-projects/MetaWearCordova-Plugin
sudo ember install ember-bootstrap

bower install

sudo ember cdv:build --platform android
