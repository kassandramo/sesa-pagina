import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserDataService } from '../../core/services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isProfileExpanded: boolean = true;
  rol:string = '';
  
  constructor(private userDataService: UserDataService){
    this.userDataService.getUserData()
  }

  
  ngOnInit() {
    const userData = this.userDataService.getUserData();
    if (userData) {
      this.rol = userData.ID_ROL;
    }
  }

}
