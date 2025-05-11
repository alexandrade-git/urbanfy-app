import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false, // Oculta o cabeçalho na tela inicial
        }}
      />
      <Stack.Screen
        name="telaPrincipal"
        options={{
          title: 'Tela Principal',
          headerShown: false, // Oculta o cabeçalho na tela principal
        }}
      />
      <Stack.Screen
        name="novoRelato"
        options={{
          title: 'Novo Relato',
          headerShown: false, // Oculta o cabeçalho na tela de novo relato
        }}
      />
      <Stack.Screen
        name="infoRelato"
        options={{
          title: 'Detalhes do Relato',
          headerShown: false, // Oculta o cabeçalho na tela de detalhes do relato
        }}
      />
    </Stack>
  );
}
