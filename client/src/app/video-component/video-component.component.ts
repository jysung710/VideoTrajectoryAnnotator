import { Component, ElementRef, Renderer2, EventEmitter, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import { Observable } from 'rxjs/Rx'
import { HttpService } from '../services/http-service/http.service'
//import * as d3 from 'd3'
import * as videojs from 'video.js'


@Component({
  selector: 'video-component',
  templateUrl: './video-component.component.html',
  styleUrls: ['./video-component.component.css'],
  host: {
  '(document:keydown)': 'onKeydown($event)'
  }
})

export class VideoComponentComponent implements OnInit, AfterViewInit{
  // D3
  //private parentNativeElement : any;

  // server
  private url : string = "http://localhost:17358/"
  videolist : string[] = []

  // video property
  //@ViewChild('vid') video : ElementRef
  private video : any
  private videoWidth : number = 0
  private videoHeight : number = 0
  videoId : string = 'video.mp4'
  videoTitle : string = ''
  vidCategory : string = 'Select Category'
  vidCatList : string[] = []
  //mousestatus
  mousedown : boolean = false
  // Mouse coords
  highLights : any[] = []
  private coordSequence : any[] = []
  pixelX : number = 0
  pixelY : number = 0
  longitude : number = 0
  latitude : number = 0
  // Frame counter
  private startframe : number = 0
  framecount : number = 0
  fps : number = 30
  interval : number = 1
  // canvas property
  //@ViewChild("draw") canvas : ElementRef
  private canvas : any
  private context : any


  constructor(private elementRef: ElementRef,
    private rd : Renderer2, private httpService : HttpService ) {
      //this.parentNativeElement = elementRef.nativeElement;
  }

  ngOnInit() {
    let timer = Observable.timer(0,20);
    timer.subscribe(t=> {
      this.updateFrameCount(t);
    });

    /*var tooltip = d3.selectAll(".tooltip:not(.css)");
    var SVGmouseTip = d3.select("g.tooltip.mouse");

    d3.select("svg").select("g")
      .selectAll("#vid")
      .attr("title", "Auto")
      .on("mouseover", function() {
        tooltip.style("opacity", "1");
        //tooltip.style("color", this.getAttribute("fill"));
        //var mouseCoords = d3.mouse(SVGmouseTip.node().parentElement);
        SVGmouseTip.attr("transform", "translate("
        + (123) + "," + (123) +")");
      });*/
  }

  ngAfterViewInit() {
    //this.canvasInit();
    this.video = document.getElementById('vid');
    this.httpService.getJson('videos/list/').subscribe(
      data => {
        console.log('data', data);
        this.vidCatList = data;
      }
    )
  }

  resize_canvas(element: any) {
    this.canvas = document.getElementById('cvoverlay');
    //this.context = this.canvas.getContext('2d');
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  getVideoProperty() {
    this.videoWidth = this.video.videoWidth;
    this.videoHeight = this.video.videoHeight;
  }

  updateFrameCount(t : number) {
    var tmp = Math.floor(this.video.currentTime * this.fps);
    if(this.framecount != tmp){
        //if(Math.abs(tmp-this.framecount) >= this.interval){
      this.framecount = tmp;
      this.coordSequence.push({
        frame : this.framecount,
        coord : [this.longitude, this.latitude]
      });

      if(this.mousedown) {
        this.highLights.push({
          frame : this.framecount,
          coord : [this.longitude, this.latitude]
        });
      }
      //}
    }
  }

  cutOff(x, y, width, height) {
    x = Math.max(Math.min(x, width-1), 0);
    y = Math.max(Math.min(y, height-1), 0);
    return {posX: x, posY:y}
  }

  onMouse(event : MouseEvent) {
    //var videodat = this.video.nativeElement;
    var videoWidth = this.video.videoWidth;
    var videoHeight = this.video.videoHeight;
    var clientWidth = this.video.clientWidth;
    var clientHeight = this.video.clientHeight;
    var scaleX = videoWidth / clientWidth;
    var scaleY = videoHeight / clientHeight;
    let pos = this.cutOff(event.offsetX, event.offsetY, clientWidth, clientHeight);
    this.pixelX = (pos.posX * scaleX) + 0.5 | 0;
    this.pixelY = (pos.posY * scaleY) + 0.5 | 0;

    this.latitude = Math.round(((this.pixelY / (this.video.videoHeight / 180) - 90) / -1) * 10 )/10;
    this.longitude = Math.round((this.pixelX / (this.video.videoWidth / 360) - 180) * 10) / 10;

    if(event.type == "mousemove"){
    }
    if(event.type == "click") {
      console.log(event);
      this.highLights.push({
        frame : this.framecount,
        coord : [this.longitude, this.latitude]
      });
    }

    if(event.type == "mousedown") {
      this.mousedown = true;
    }
    if(event.type == "mouseup") {
      this.mousedown = false;
    }
  }

  makeData(name) {
      console.log(this.vidCategory);
      return {
        vid : this.videoId.slice(0, -4),
        name : name,
        cat : this.vidCategory,
        log : this.coordSequence,
        hl : this.highLights
      }
  }

  chooseCategory(event) {
    this.vidCategory = event.target.innerText;
    this.httpService.getJson('videos/list/'+this.vidCategory).subscribe(
      data => {
        console.log('data', data);
        this.videolist = data;
      }
    )
  }

  saveLog() {
    var name = prompt("Input your name")
    if((name != '') && (name != null)){
      this.httpService.postJson('log/save', this.makeData(name))
      .subscribe(
        data => {
          console.log('data', data);
          console.log(document.getElementById('success'));
          alert('SAVED');
          this.coordSequence = [];
          this.highLights = [];
        },
        error => {
          console.log(error);
          alert('ERROR : ' + error);
        }
      );
    }
    else {
      alert("ERROR: Check your name")
    }
  }

  setVid(event) {
    var vid = event.target.innerText.split(':')[1];
    vid = vid.slice(1, vid.length);

    this.videoTitle = event.target.innerText;
    this.videoId = vid;
    this.coordSequence = [];
    this.highLights = [];
    this.httpService.getJson('videos/fps/'+this.vidCategory+"/"+this.videoId).subscribe(
      data => {
        this.fps = data.fps;
      }
    );
    this.video.load();
  }

  onKeydown(event){
    console.log(event);
    if(event.key == " ") {
      event.preventDefault();
      if(this.video.paused)
        this.video.play();
      else
        this.video.pause();
    }
    if(event.key == 'Enter') {
      event.preventDefault();
      this.saveLog();
    }
  }

  reloadVid() {
    if(confirm("Reload video? All data will be rest.")){
      this.coordSequence = [];
      this.highLights = [];
      this.httpService.getJson('videos/fps/'+this.vidCategory+"/"+this.videoId).subscribe(
        data => {
          this.fps = data.fps;
        }
      );
      this.video.load();
    }
  }
}
