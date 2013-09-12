window.onload = function(){

//-----------------------------------------------------------
// Utils
//-----------------------------------------------------------


function setVal(o , v){
	for(var k in v){
		o[k] = v[k];
	}
}

var M = Math,
	PI = M.PI;

//random number [0..n]
function rand(n){
	n++;
	return M.floor(n*M.random());
}

//Point class
function P(x, y){
    this.x = x || 0;
    this.y = y || 0;
};
P.prototype = {
	i: function(){
		this.x =0;
		this.y = 0;
	},
	l: function(){
		return M.sqrt(this.x * this.x + this.y * this.y);
	},
	n : function(d){
		var l = this.l();
		d = d || 1;
		this.x = this.x / l * d;
		this.y = this.y / l * d;
	},
	a: function(){
		return Math.atan2(this.y,this.x)
	},
	diff : function(p1,p2){
		this.x = p2.x-p1.x;
		this.y = p2.y-p1.y;
	}
};

//-----------------------------------------------------------
// Input
//-----------------------------------------------------------

//Set up key listener
function onkey(d ,e) {
	if (!e) e = window.e;
	var c = e.keyCode;
	if (e.charCode && c == 0)
		c = e.charCode;
	
	if(c==37) keys.l1 = d; //left
	if(c==38) keys.u1 = d; //up
	if(c==39) keys.r1 = d; //rigth
	if(c==40) keys.d1 = d; //down
	
	if(c==65 || c==81) keys.l2 = d; //a/q
	if(c==90 || c==87) keys.u2 = d; //z/w
	if(c==83) keys.d2 = d; //s
	if(c==68) keys.r2 = d; //d
	
};
document.onkeyup = function(e) { 
	onkey(0 , e); 
};
document.onkeydown = function(e) { 
	onkey(1 , e); 
};

//-----------------------------------------------------------
// Game Classes
//-----------------------------------------------------------


function Entity(t, w, h){
	this.pos = new P();
	this.center = new P();
	this.dir = new P();
	this.t = t;
	this.w = w;
	this.h = h;
	entities.push(this);
	this.setPos(0,0);
};
Entity.prototype = {
	move : function(v){
		if(v.x){
			this.pos.x += v.x;
			this.center.x = this.pos.x+this.w/2;
			this.flip = v.x<0;
		}
		if(v.y){
			this.pos.y += v.y;
			this.center.y = this.pos.y+this.h/2;
		}
	} ,
	setPos : function(x,y){
		console.log("setPos",x,y);
		this.pos.x = x;
		this.pos.y = y;
		this.center.x = this.pos.x+this.w/2;
		this.center.y = this.pos.y+this.h/2;
	},
	collides: function(e2){
		return (M.abs(this.center.x-e2.center.x) < this.w*0.5 + e2.w*0.5
			&& M.abs(this.center.y-e2.center.y) < this.h*0.5 + e2.h*0.5 )
	},
	render: function(){
		var x = ~~this.pos.x,
			y = ~~this.pos.y,
			s = this.skin,
			f = this.flip,
			sx = s.x ,
			rx = this.w*0.5 ,
			ry = this.h*0.25 ;
		
		//Draw shadow
		ctx.save(); // save state
        ctx.beginPath();
		ctx.translate(-camera+x+this.w*0.5-rx , y+this.h-ry-2);
        ctx.scale(rx, ry);
        ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);
        ctx.restore(); // restore to original state
		ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();
		
		
		if(this.t==PLAYER){
			if(attack.on){
				f = attack.direction == -1;
				sx += 33;
			}
		}else if(this.t==CAT){
			if(this.flying){
				s = this.skin2; 
				sx = s.x;
			}
		}
		
		var P = 24;
		if(isNaN(this.jumpCount)) this.jumpCount = rand(P)
		y = ~~(y - M.abs(M.sin(this.jumpCount*PI/P))*4 );
		this.jumpCount++;
		this.jumpCount = this.jumpCount%P;
		
		if(f){
			ctx.save();
			ctx.translate(s.w, 0);
			ctx.scale(-1, 1);
		}
		ctx.drawImage(img , sx, s.y, s.w , s.h,
				(-camera + x - s.dx)*(f?-1:1) , y - s.dy , s.w , s.h);
		if(f){
			ctx.restore();
		}
	}
};
Entity.ySort = function(e1,e2){
	return e1.pos.y - e2.pos.y;
};



//-----------------------------------------------------------
// Game
//-----------------------------------------------------------

var CAT = "c", PLAYER = "p", ATTACK = "a",
	canvas = document.getElementById("c"),
	img = document.getElementById("img"),
	ctx = canvas.getContext("2d"),
	canvas2 = document.createElement("canvas"),
	ctx2 = canvas2.getContext("2d"),
	WIDTH = canvas.width = 800,
	HEIGHT = canvas.height = 600,
	entities = [],
	//player
	player = null,
	attack = null,
	//keys
	keys = {l:0 , u:0 , r:0 , d:0},
	cats = [],
	pt = new P(),
	pt2 = new P(),
	pt3 = new P(),
	camera = 0,
	img;
	

function init(){
	player = new Entity(PLAYER , 18 , 22 );
	player.skin = {x:24,y:0,w:32,h:46,dx:8,dy:24};
	player.setPos( WIDTH/2-player.w/2,
				   HEIGHT/2-player.h/2 );
	player.speed = 4;
	
	attack = {
		on : false,
		radius: 24,
		angle: 0.35,
		val: 0,
		max: 100,
		min: 20,
		recover: 0.6
	};
	attack.val = attack.max;
	
	while(cats.length < 13){
		var cat = new Entity(CAT, 19, 16);
		cat.skin = {x:0,y:0,w:21,h:32,dx:1,dy:16};
		cat.skin2 = {x:0,y:48,w:41,h:18,dx:12,dy:2};
		//cat.setPos( (rand(1)==0) ? -90 : WIDTH+74 , 
		cat.setPos( -90 , 
					rand(HEIGHT-16) );
		cats.push(cat);
		
		cat.speedX = 1+M.random()*0.2;
		cat.speedY = 1+M.random()*0.2;
		cat.repulsion = 0.5 + M.random()*0.5;
		cat.attraction = 1 + M.random()*0.5;
		
		cat.flySpeed = 8;
		cat.flying = false;
		cat.flyingDist = 0;
		
	}
	
	//background
	canvas2.width = 2*WIDTH;
	canvas2.height = HEIGHT;
	var sliceW = 50 , nFlower = 20 , nSlice=WIDTH/sliceW;
	var i,j,x,y;
	ctx2.fillStyle = "rgb(158,255,125)";
	ctx2.fillRect(0,0,2*WIDTH,HEIGHT);
	for(i=0 ; i<nSlice ; i++){
		for(j=0 ; j<nFlower ; j++){
			ctx2.drawImage(img , 104+3*rand(3) , 0 , 3 , 3,
				~~(i*sliceW+M.random()*(sliceW-3)) , ~~(M.random()*(HEIGHT-3)) , 3 ,3);
		}
	}
	ctx2.drawImage(canvas2 , WIDTH , 0);
	//document.body.appendChild(canvas2);
	
	//start ticking !
	tic();
}

function tic(){
	//console.log(attack.val);

	
	
	//move player
	pt.i();
	if(keys.l2){
		pt.x = -1;
	}else if(keys.r2){
		pt.x = 1;
	}
	if(keys.u2){
		pt.y = -1;
	}else if(keys.d2){
		pt.y = 1;
	}
	//pt.n(player.speed);
	pt.x*=player.speed;
	pt.y*=player.speed;
	
	player.move(pt);
	
	//player attack
	if(keys.l1 || keys.r1){
		if(!attack.on && attack.val>attack.min){ 
			attack.on = true;
			attack.direction = keys.l1 ? -1 : 1;
		}
	}else{
		attack.on = false;
	}
	if(attack.on){
		if(attack.val>0){
			attack.val--;
		}else{
			attack.on = false;
		}
	}else{
		//cooldown
		if(attack.val<attack.max){
			attack.val += attack.recover;
		}
	}
	
	//move cats
	var i,j,cat,cat2,dist,dist2;	
	for(i in cats){
		cat=cats[i];
		
		
		
		//Player distance
		pt.diff(cat.center , player.center);
		dist = pt.l();
			
		if(attack.on 
			&& cat.pos.y<player.pos.y+player.h
			&& cat.pos.y+cat.h>player.pos.y){
			
			var shoot = false;
			if(attack.direction == -1
				&& cat.pos.x+cat.w>player.pos.x-20 && cat.pos.x+cat.w<player.center.x){
				shoot = true;
			}else if(attack.direction == 1
				&& cat.pos.x<player.pos.x+player.w+20&& cat.pos.x>player.center.x){
				shoot = true;
			}
			if(shoot){
				cat.flying = true;
				pt2.n();
				cat.dir.x = attack.direction;
				cat.dir.y = 0;
			}
		}
		
		if(cat.pos.x < camera - 100 || cat.pos.x > camera+WIDTH+200){
			//too far away -> place elsewhere
			if(M.random()>0.5){
				//top / bottom
				cat.setPos( camera + M.random()*WIDTH , M.random()>0.5 ? -50 : HEIGHT+20);
			}else{
				//left / right
				cat.setPos( camera + WIDTH+20 , M.random()*HEIGHT );
			}
			cat.flying = false;
		}
		
		if(!cat.flying){
		
			//Player attraction
			pt.n(cat.attraction);
			
			//Other cats repulsion
			pt3.i();
			for(j in cats){
				if(i!=j){
					cat2 = cats[j];
					if(!cat2.flying){
						pt2.diff(cat2.center,cat.center);
						dist2 = pt2.l();
						pt2.n();
						if(dist2<300){
							dist2 = ((300-dist2)/dist2);
							dist2 *= dist2;
							pt3.x += pt2.x*dist2;
							pt3.y += pt2.y*dist2;
						}
					}
				}
			}
			if(pt3.x!=0 && pt3.y!=0){
				pt3.n(cat.repulsion);
				pt.x += pt3.x;
				pt.y += pt3.y;
			}
			
			var speedX = cat.speedX;
			var speedY = cat.speedY;
			/*
			if(dist>200){
				if(dist>400){
					speedX = player.speed;
					speedY = player.speed;
				}else{
					dist = (dist-200)/(400-200);
					speedX = player.speed*dist+(1-dist)*speedX;
					speedY = player.speed*dist+(1-dist)*speedY;
				}
			}
			*/
			pt.x *= speedX;
			pt.y *= speedY;
			
			
			cat.move(pt);
			
		}else{
			//Flying cat
			pt.x = cat.dir.x*cat.flySpeed;
			pt.y = cat.dir.y*cat.flySpeed;
			cat.move(pt);
			
			//collide with other cats
			for(j in cats){
				cat2 = cats[j];
				if(cat!=cat2){
					if(cat.collides(cat2)){
						cat2.flying = true;
						cat2.dir.x = cat.dir.x;
						cat2.dir.y = 0;
						cat.dir.x *= -1;
					}
				}
			}
			
			/*
			cat.flyingDist+=2;
			if(cat.flyingDist > 200){
				cat.flyingDist = 0;
				cat.flying = false;
			}
			*/
		}
	}
	
	//update camera
	camera = ~~(player.pos.x - WIDTH/2);
	if(camera<0) camera = 0;
	
	//ctx.fillStyle = "#8f6";
	//ctx.fillRect(0,0,WIDTH,HEIGHT);
	ctx.drawImage(canvas2 , -camera%WIDTH , 0); 
	
	//render
	entities = entities.sort(Entity.ySort);
	for(i in entities){
		entities[i].render();
	}
	//loop
	window.requestAnimationFrame(tic);
};

//init game
init();

};