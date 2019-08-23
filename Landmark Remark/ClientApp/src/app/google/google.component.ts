
import { Component, OnInit, ViewChild, ElementRef, NgZone, Input, AfterViewInit } from '@angular/core';
import { MapsAPILoader, MouseEvent } from '@agm/core';
import { Iuserinfo, Iuserdetail } from 'src/model/userinfo';
import { UserService } from '../shared/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'app-google',
  templateUrl: './google.component.html',
  styleUrls: ['./google.component.css']
})
export class GoogleComponent implements OnInit, AfterViewInit {
  
  title: string = 'Landmark Remark Project';
  private geoCoder;
  
  userinfo:any = {};
  @Input() userdetail;
  latitude: number;
  usersinfo: Iuserinfo[] = [];
  filteredUsers: Iuserinfo[] = [];
  longitude: number;
  zoom: number;
  address: string;
  searchvalue: string = '';
  results: Iuserinfo;
  searchTerm$ = new Subject<string>();
  source: any;

  @ViewChild('info')
  public info: ElementRef;
  @ViewChild('search')
  public searchElementRef: ElementRef;


  constructor(
    private mapsAPILoader: MapsAPILoader,
    private service: UserService,
    private toastr: ToastrService
  ) { }


  ngOnInit() {
      this.getUserLocations();
      this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation();
      this.geoCoder = new google.maps.Geocoder;
    });
  }

  ngAfterViewInit(): void {
    this.source = fromEvent(this.searchElementRef.nativeElement, 'keyup');
    this.source.pipe(debounceTime(1200)).subscribe(() => {
      this.filteredUsers = this.service.searchEntries(this.searchElementRef.nativeElement.value);
    });
  }

 
  onMouseOver(infoWindow) {
      let loc = this.service.getUserNotes(this.address);
      if (loc.length > 0) {
      infoWindow.open();
      this.searchvalue = loc[loc.length - 1].notes;
    }
    else
      infoWindow.close();
   }

  onMouseOut(infoWindow) {
    if (this.searchvalue != '') {
      infoWindow.close();
    }
    this.searchvalue = '';
  }

  mapClick(infoWindow){
  infoWindow.close();
}

//Save user entered notes in the backend 
  private sendNotes(data,infoWindow) {
    this.info.nativeElement.value = '';

    if (infoWindow) {
      infoWindow.close();
    }

    this.searchvalue = data;
    this.userinfo.username = this.userdetail.userName;
    this.userinfo.notes = data;
    this.userinfo.address = this.address;
   
    this.saveUserProfile(this.userinfo);
    this.getUserLocations();
  }

//Get all the user locations
  private getUserLocations() {
    this.service.getUserLocations().subscribe((loc: Iuserinfo[]) => {
      console.log(this.usersinfo);
      this.usersinfo = loc;
    });
  }

//Save user profiles
  private saveUserProfile(userinfo: Iuserinfo) {
    this.service.saveUserProfile(userinfo).subscribe((res) => {
      console.log(res);
    },
     err => {
        if (err.status == 500)
          this.toastr.error('Internal Server Error', 'UserDetails not saved.');
        else
          console.log(err);
      }
    );    
  }

  // Get Current Location Coordinates
  private setCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 8;
        this.getAddress(this.latitude,this.longitude);
      });
    }
  }

// End marker to get current coordinates
  markerDragEnd($event: MouseEvent) {
    console.log($event);
    this.latitude = $event.coords.lat;
    this.longitude = $event.coords.lng;
    this.getAddress(this.latitude,this.longitude);
  }

  //Get address details for each latitude and longitude
  getAddress(latitude:number,longitude:number) {
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
      console.log(results);
      console.log(status);
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 12;
          this.address = results[0].formatted_address;
        } else {
          this.toastr.error('No results found');
        }
      } else {
        this.toastr.error('Geocoder failed due to: ' + status);
      }
    });
  }

}
