// Jest mock for AsyncStorage (official mock shipped by the library).
// Needed because utils/analytics.ts imports AsyncStorage at module load;
// without this, any test importing RevenueCatProvider fails to run.
export { default } from '@react-native-async-storage/async-storage/jest/async-storage-mock';
