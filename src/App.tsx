// Import React hooks and components
import { useRef, useState, useEffect } from "react";

// Import custom components and data
import Places from "./components/Places.tsx";
import { AVAILABLE_PLACES, AvailablePlacesState } from "./data.ts";
import Modal from "./components/Modal.tsx";
import DeleteConfirmation from "./components/DeleteConfirmation.tsx";
import logoImg from "./assets/logo.png";
import { sortPlacesByDistance } from "./loc.ts";

// Retrieve selected places from local storage
const storeIds = JSON.parse(
  localStorage.getItem("selectedPlaces") || "[]"
) as string[];

// Filter available places based on stored IDs
const storedPlaces = storeIds
  .map((id) => AVAILABLE_PLACES.find((place) => place.id === id))
  .filter((places): places is AvailablePlacesState => places !== undefined);

function App() {
  // Create refs for modal and selected place
  const selectedPlace = useRef<string | undefined>();

  // State for available and picked places
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [availablePlaces, setAvailablePlaces] = useState<
    AvailablePlacesState[]
  >([]);
  const [pickedPlaces, setPickedPlaces] =
    useState<AvailablePlacesState[]>(storedPlaces);

  // Fetch user's current location and sort available places by distance
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      // Sort places by distance using user's coordinates
      const sortedPlaces = sortPlacesByDistance(
        AVAILABLE_PLACES,
        position.coords.latitude,
        position.coords.longitude
      );

      // Update state with sorted available places
      setAvailablePlaces(sortedPlaces);
    });
  }, []);

  // Open modal to confirm place removal
  function handleStartRemovePlace(id: string) {
    setModalIsOpen(true);
    selectedPlace.current = id;
  }

  // Close modal without removing the place
  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  // Add selected place to the picked places and store in local storage
  function handleSelectPlace(id: string) {
    setPickedPlaces((prevPickedPlaces) => {
      // Check if the place is already selected
      if (prevPickedPlaces.some((place) => place.id === id)) {
        return prevPickedPlaces;
      }
      // Find the selected place from available places
      const place = AVAILABLE_PLACES.find((place) => place.id === id);

      if (place) {
        // Add the selected place to the beginning of the picked places list
        return [place, ...prevPickedPlaces];
      }

      return prevPickedPlaces;
    });

    // Update local storage with the newly selected place
    const storeIds = JSON.parse(
      localStorage.getItem("selectedPlaces") || "[]"
    ) as string[];
    if (storeIds.indexOf(id) === -1) {
      localStorage.setItem("selectedPlaces", JSON.stringify([id, ...storeIds]));
    }
  }

  // Remove the selected place from picked places and local storage
  function handleRemovePlace() {
    setPickedPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current)
    );
    setModalIsOpen(false);

    // Update local storage after removing the place
    const storeIds = JSON.parse(
      localStorage.getItem("selectedPlaces") || "[]"
    ) as string[];
    localStorage.setItem(
      "selectedPlaces",
      JSON.stringify(storeIds.filter((id) => id !== selectedPlace.current))
    );
  }

  // Render the main app component
  return (
    <>
      {/* Modal component for delete confirmation */}
      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      {/* Header section with logo and app information */}
      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>

      {/* Main content with two sections: picked places and available places */}
      <main>
        {/* Display picked places with the option to remove */}
        <Places
          title="I'd like to visit ..."
          fallbackText={"Select the places you would like to visit below."}
          places={pickedPlaces}
          onSelectPlace={handleStartRemovePlace}
        />

        {/* Display available places with the option to select */}
        <Places
          title="Available Places"
          fallbackText="Sorting places by distance..."
          places={availablePlaces}
          onSelectPlace={handleSelectPlace}
        />
      </main>
    </>
  );
}

// Export the App component as the default export
export default App;
