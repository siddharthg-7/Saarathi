import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
