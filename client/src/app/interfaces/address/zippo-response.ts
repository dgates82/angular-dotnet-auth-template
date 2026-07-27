export interface IZippoResponse {
  postCode: string;
  places: IPlace[];
}

export interface IPlace {
  placeName: string;
  longitude: string;
  state: string;
  stateAbbreviation: string;
  latitude: string;
}
