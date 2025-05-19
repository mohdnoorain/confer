import { Injectable } from "@nestjs/common";

@Injectable()
export class GlobalService {
    isAuthenticated(): boolean {
        return true;
    }
}