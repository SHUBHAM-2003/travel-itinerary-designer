@echo off
cd /d G:\shubh_stack\karvir_bot\travel-itinerary-designer
git add .
git commit -m "Initial commit"
gh repo create travel-itinerary-designer --public --source=. --remote=origin --push
echo Done!
