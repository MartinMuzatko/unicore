import BaseState from './base';
import constants from '../constants'

export default class Highscore extends BaseState {

    init(score) {
        this.highScore = score
    }

    preload() {

    }

    create() {
        super.create();

        const game = this.game;
        this.notice = game.add.text(game.world.centerX - 20, game.height*.95, '',{fill:"#ffffff",font: '20px Bungee', boundsAlignV: 'middle', boundsAlignH: 'center'});

        const buttonTextStyle = {
            fill: '#FFFFFF',
            font: '30px Bungee',
            boundsAlignV: 'middle',
            boundsAlignH: 'center'
        };

        this.startButton = game.add.button(game.world.centerX - 100, game.height*.8, 'startButton', ()=>{this.returnToStart()});
        this.startButtonText = game.add.text(game.world.centerX - 20, game.height*.825, 'Lift off!',buttonTextStyle);


        this.submitted = false
        this.started = false
        this.isPlaying = false


        if (!this.submitted && this.highScore) {
            this.drawHighscoreEnter()
        } else if (!this.started) {
            this.game.input.keyboard.addCallbacks(this.game,()=>{},(e)=>{
                if (e.key == 'Enter') {
                    this.returnToStart()
                }
            })
        }

        if (this.highScore) {
            this.startButtonText.text = '  Submit'
            this.name = localStorage.getItem('name') || ''
            if (this.name.length < 1) {
                this.notice.text = 'Enter your name'
            }

            this.score.score = this.highScore
            const localHighscore = this.score.getHighScore()
            this.score.highScore = localHighscore > this.highScore ? localHighscore : this.highScore
            this.score.update()
        } else {
            //this.score.getScores()
        }

    }

    incrementCharacterText(e) {
        var char = this.characters[e.character]
        var graphic = this.characterGraphics[e.character]
        var newChar = String.fromCharCode(65 + ((char.charCodeAt(0)+1 - 65) % 26))
        this.characters[e.character] = newChar
        graphic.text = newChar
    }

    decrementCharacterText(e) {
        var char = this.characters[e.character]
        var newChar = String.fromCharCode(65 + ((26 + (char.charCodeAt(0)-1 - 65)) % 26))
        this.characters[e.character] = newChar
        var graphic = this.characterGraphics[e.character]
        graphic.text = newChar
    }

    setCharacter(character) {
        this.characters[this.selectedCharacter] = character
        var graphic = this.characterGraphics[this.selectedCharacter]
        graphic.text = character
        this.incrementCharacterPosition()
    }

    incrementCharacterPosition() {
        this.selectedCharacter = this.selectedCharacter == this.characters.length-1 ? 0 : this.selectedCharacter+1
        this.setCharacterUnderline()
    }

    decrementCharacterPosition() {
        this.selectedCharacter = this.selectedCharacter == 0 ? this.characters.length-1 : this.selectedCharacter-1
        this.setCharacterUnderline()
    }

    setCharacterUnderline() {
        this.underline.destroy()
        var character = this.selectedCharacter
        var left = game.width*.5 - (game.width*this.characters.length*.1)/2 - game.width*.1 + game.width*.1 + game.width*.1*character
        var top = game.height*.4
        this.underline = game.add.graphics(left, top - game.height*.005)
        this.underline.beginFill(0xffffff)
        this.underline.drawRect(0,0,game.width*.055,2)
        this.underline.endFill()

    }

    drawHighscoreEnter() {
        const buttonTextStyle = {
            fill: '#FFFFFF',
            font: '30px Bungee',
            boundsAlignV: 'middle',
            boundsAlignH: 'center'
        };
        this.characters = ('A,').repeat(constants.MAX_NAME_LENGTH).split(',').splice(0,constants.MAX_NAME_LENGTH)
        this.selectedCharacter = 0
        this.activeCharacter = []
        this.characterGraphics = []
        this.underline = {destroy:()=>{}}

        for (var character in this.characters) {
            console.log(game.width*.1 + game.width*.05*character);
            var left = game.width*.5 - (game.width*this.characters.length*.1)/2 - game.width*.1 + game.width*.1 + game.width*.1*character
            var top = game.height*.4
            var text = game.add.text(left+game.width*.015, game.height*.325, this.characters[character],buttonTextStyle);
            this.characterGraphics.push(text)
            var down = game.add.graphics(left, top + game.height*.0125)
            down.beginFill(0xffffff)
            down.lineTo(50,0)
            down.lineTo(25,25)
            down.lineTo(0,0)
            down.endFill()
            down.inputEnabled = true
            down.character = character | 0
            down.events.onInputDown.add((e)=>{
                this.incrementCharacterText(e)
            })

            var up = game.add.graphics(left, top - game.height*.1)
            up.beginFill(0xffffff)
            up.lineTo(50,0)
            up.lineTo(25,-25)
            up.lineTo(0,0)
            up.endFill()
            up.inputEnabled = true
            up.character = character | 0
            up.events.onInputDown.add((e)=>{
                this.decrementCharacterText(e)
            })
        }

        this.game.input.keyboard.addCallbacks(this.game,()=>{},(e)=>{
            console.log(e);
            if (e.key == 'ArrowDown') {
                this.incrementCharacterText({character:this.selectedCharacter})
            }
            if (e.key == 'ArrowUp') {
                this.decrementCharacterText({character:this.selectedCharacter})
            }
            if (e.key == 'ArrowRight') {
                this.incrementCharacterPosition()
            }
            if (e.key == 'ArrowLeft') {
                this.decrementCharacterPosition()
            }
            if (e.key.match(/^[\w\s]$/g)) {
                this.setCharacter(e.key.toUpperCase())
            }
            if (e.key == 'Enter') {
                this.submit()
            }
        })
    }

    returnToStart() {
        if (this.score.uploaded || !this.score.score) {
            this.started = true
            this.state.start('game', true, false, this.highScore)
        } else {
            this.notice.text = 'press [ENTER] to submit your score';
        }
    }

    submit() {
        this.submitted = true
        this.startButtonText.text = 'Lift off!'
        new Promise((resolve, reject)=>{
            localStorage.setItem('name',this.name)
            this.score.upload(this.highScore, this.name, resolve)
        }).then(()=>{
            this.score.getScores(true)
        })
    }

    update() {
        super.update()
        // go to different state with this.state.start()
        // this.state.start('game');
    }

    shutdown() {

    }

}
