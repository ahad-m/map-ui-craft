import { useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  onPredictionsChange: (predictions: google.maps.places.AutocompletePrediction[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
}

export const PlacesAutocomplete = ({ onPlaceSelect, onPredictionsChange, inputRef, searchQuery }: PlacesAutocompleteProps) => {
  const places = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!places) return;

    autocompleteService.current = new places.AutocompleteService();
    placesService.current = new places.PlacesService(document.createElement('div'));
  }, [places]);

  useEffect(() => {
    if (!autocompleteService.current || !searchQuery || searchQuery.length < 2) {
      onPredictionsChange([]);
      return;
    }

    const request = {
      input: searchQuery,
      componentRestrictions: { country: 'sa' },
      language: 'ar',
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        onPredictionsChange(predictions);
      } else {
        onPredictionsChange([]);
      }
    });
  }, [searchQuery, onPredictionsChange]);

  const getPlaceDetails = (placeId: string) => {
    if (!placesService.current) return;

    const request = {
      placeId,
      fields: ['name', 'geometry', 'formatted_address', 'place_id'],
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        onPlaceSelect(place);
      }
    });
  };

  return null;
};
