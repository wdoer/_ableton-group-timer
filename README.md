# Ableton Group Timer

The script will help you to get data about in the form of a countdown timer at the end of the song you assign. 

This code only provides you with the timer data that you receive via sockets, so you are free to use whichever design you choose.

Bring up your server and configure .env so that the timer-date is sent correctly.

For the timer to work you need to install the MIDI-script from the AbletonJS repository, then run the script and it should have feedback from your enabled ableton.

Next, wrap your track that you want to track in a group, create a new track or rename an existing track so that it has the name “timer” in it.
