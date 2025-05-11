// app/telaInicial.tsx
import { useRouter } from 'expo-router'; // Hook para navegação
import React from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const router = useRouter();  // Usando o hook para navegação

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Image
        source={require('../../assets/images/logo.png')}  // Atualize o caminho da imagem conforme necessário
        style={styles.logo}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/telaPrincipal')}  // Navegação para 'telaPrincipal.tsx'
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: '180%',
    height: 350,
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    width: '80%',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
