import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { FamilyTreeComponent } from './app/family-tree/family-tree.component';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));


bootstrapApplication(FamilyTreeComponent, appConfig)
  .catch((err) => console.error(err));
