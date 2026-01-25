import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiBaseService } from '../api/api-base.service';
import { EnvironmentConfig } from '../config/environment.config';
import { LoggerService } from '../logging/logger.service';

/**
 * Example repository implementation showing how to use ApiBaseService
 * with environment-based API configuration
 *
 * This extends ApiBaseService which automatically uses the correct
 * API URL based on the environment (local, staging, or production)
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleRepositoryImpl extends ApiBaseService {

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  // Example: GET request
  getItems<T>(): Observable<T[]> {
    // Will call: http://localhost:8080/jbh-api/items (local)
    // or https://stg-api.yourdomain.com/jbh-api/items (staging)
    // or https://api.yourdomain.com/jbh-api/items (production)
    return this.get<T[]>('/items');
  }

  // Example: GET by ID
  getItemById<T>(id: string): Observable<T> {
    return this.get<T>(`/items/${id}`);
  }

  // Example: POST request
  createItem<T>(item: T): Observable<T> {
    return this.post<T>('/items', item);
  }

  // Example: PUT request
  updateItem<T>(id: string, item: T): Observable<T> {
    return this.put<T>(`/items/${id}`, item);
  }

  // Example: DELETE request
  deleteItem(id: string): Observable<void> {
    return this.delete<void>(`/items/${id}`);
  }

  // Example: GET with query parameters
  searchItems<T>(searchTerm: string): Observable<T[]> {
    const options = {
      params: { q: searchTerm }
    };
    return this.get<T[]>('/items/search', options);
  }
}
