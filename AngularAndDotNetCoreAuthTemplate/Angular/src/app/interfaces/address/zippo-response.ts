export interface IZippoResponse {
  postCode: string;
  places: IPlace[];
}

export interface IPlace {
  placeName: string;
  longitude: number;
  state: string;
  stateAbbreviation: string;
  latitude: number;
}
