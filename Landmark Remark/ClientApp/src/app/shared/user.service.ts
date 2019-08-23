import { Injectable } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Iuserinfo } from 'src/model/userinfo';
import { Observable, of} from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private fb: FormBuilder, private http: HttpClient) { }
  readonly BaseURI = 'http://localhost:54277/api';
  usersinfo: Iuserinfo[] =[];

//Create registration form
  formModel = this.fb.group({
    UserName: ['', Validators.required],
    Email: ['', Validators.email],
    FullName: [''],
    Passwords: this.fb.group({
      Password: ['', [Validators.required, Validators.minLength(4)]],
      ConfirmPassword: ['', Validators.required]
    }, { validator: this.comparePasswords })

  });

//Compare passwords
  comparePasswords(fb: FormGroup) {
    let confirmPswrdCtrl = fb.get('ConfirmPassword');
    if (confirmPswrdCtrl.errors == null || 'passwordMismatch' in confirmPswrdCtrl.errors) {
      if (fb.get('Password').value != confirmPswrdCtrl.value)
        confirmPswrdCtrl.setErrors({ passwordMismatch: true });
      else
        confirmPswrdCtrl.setErrors(null);
    }
  }

  register() {
    var body = {
      UserName: this.formModel.value.UserName,
      Email: this.formModel.value.Email,
      FullName: this.formModel.value.FullName,
      Password: this.formModel.value.Passwords.Password
    };
    return this.http.post(this.BaseURI + '/ApplicationUser/Register', body);
  }

// Search function to search location and username
  search(terms$: Observable<string>) {
    return terms$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term)));
  }

// Search location and username
  searchEntries(term): Iuserinfo[] {
    return this.usersinfo.filter(user => 
      user.username.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || user.notes.toLowerCase().indexOf(term.toLowerCase()) !== -1
    );
  }

//Get usernotes for each location
  getUserNotes(search: string) {
    this.getUserLocations();
    if (search != '')
      return this.usersinfo.filter(user => user.address != null && user.address === search);
  
   }

  saveUserProfile(userinfo: Iuserinfo) {
    return this.http.post(this.BaseURI + '/UserDetail/Save', userinfo);
  }

//Get the list of user locations
  getUserLocations(): Observable<Iuserinfo[]> {
       return this.http.get<Iuserinfo[]>(this.BaseURI + '/UserDetail/Get')
      .pipe(
        tap(data => console.log(JSON.stringify(data))),
        tap(data => this.usersinfo = data),
    )
  }

  login(formData) {
    return this.http.post(this.BaseURI + '/ApplicationUser/Login', formData);
  }

  getUserProfile() {
    return this.http.get(this.BaseURI + '/UserProfile');
  }
 
}
