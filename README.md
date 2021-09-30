UFC is short for Universal Factory Calculator. It takes care of the basic arithmetic of tallying up inputs and outputs in factory games. Rather than being a "solver", this intends to be a tool that can be used to explore the problemspace manually. It's basically a glorified special-purpose spreadsheet. I wrote it for my own use, and I'm only releasing it because someone asked me to.

# Usage

Open `index.html` in any modern web browser. [Click here to open it on GitHub.io](https://solrabizna.github.io/ufc), assuming I got the URL right.

Create a new recipe by writing its name in one of the text fields on the left. Specify up to four ingredients each of input and output, along with the required quantity per unit time *for one instance of this recipe*. Specify how many instances of that recipe you wish to use using the field below the recipe name. (This could be a number of assemblers/smelters using the recipe, for example.) At the top of the page, UFC will tally up the final balance of inputs and outputs.

You can use the Back and Forward buttons in your browser for some limited navigation. If you copy and paste the page URL, including the bits after the `#`, to another person, they'll be able to see the precise setup you've created and all of its inputs and outputs. You can also bookmark a specific URL to keep a setup for later.

# Legalese

UFC embeds [Pako][1], a JavaScript port of zlib, which is licensed under the MIT and zlib licenses. It also embeds [RequireJS][2], which is MIT-licensed. The rest of UFC is copyright 2021 Solra Bizna and is licensed under the MIT license (because why not).

[1]: https://github.com/nodeca/pako
[2]: https://github.com/requirejs/requirejs

