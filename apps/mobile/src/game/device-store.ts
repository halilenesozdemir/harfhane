import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './game-storage';

export const deviceStore: KeyValueStore = AsyncStorage;
