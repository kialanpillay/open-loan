import fs from "fs";
import path from "path";

class Database {
  private static instance: Database;
  private filePath: string;

  private constructor() {
    this.filePath = path.join(process.cwd(), "/src/shared/db/db.json");
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public readData(): any {
    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading the database file:", error);
      return null;
    }
  }

  public updateData(newData: any): void {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(newData, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error writing to the database file:", error);
    }
  }
}

export const db = Database.getInstance();
