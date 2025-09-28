import { Stack } from 'expo-router';

export default function HouseholdSetupLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: false, // Disable swipe back gesture
    }}>
      <Stack.Screen 
        name="index" 
        options={{
          gestureEnabled: false, // Disable swipe back for index
        }}
      />
      <Stack.Screen 
        name="create" 
        options={{
          gestureEnabled: false, // Disable swipe back for create
        }}
      />
      <Stack.Screen 
        name="join" 
        options={{
          gestureEnabled: false, // Disable swipe back for join
        }}
      />
    </Stack>
  );
}
