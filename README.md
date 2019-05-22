[Live Glitch App](https://turquoise-timer.glitch.me)

Generates persistent shortened URLs with REST API and the MongoDB Atlas platform 

Built with: Node, Express, Mongoose, MongoDB, HTML5, CSS, Javascript

##Instructions

POST a URL to turquoise-timer.glitch.me/api/shorturl/(insert url here) to receive a shortUrl json page
Example: {"original_url":"www.google.com","short_url":1}

Only valud URLs that follow the http(s)://www.example.com(/more/routes) format will be accepted
Example: POST turquoise-timer.glitch.me/api/shorturl/https://www.spacex.com
