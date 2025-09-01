import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from "./components/navigation/navigation";
import { Footer } from "./components/footer/footer";

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, Footer],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('content-hub-frontend');
}
