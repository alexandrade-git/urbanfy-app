import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  BackHandler,
} from 'react-native';

const NovoRelato = () => {
  const router = useRouter();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace({
        pathname: '/telaPrincipal',
        params: { refresh: Date.now() }
      });
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [fotos, setFotos] = useState<(string | null)[]>([null, null, null]);
  const [categoria, setCategoria] = useState('Iluminação e Energia');

  const escolherFoto = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos da sua permissão para acessar suas fotos. Por favor, permita o acesso nas configurações do seu dispositivo.',
          [
            { text: 'OK', onPress: () => console.log('OK Pressed') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFotos = [...fotos];
        newFotos[index] = result.assets[0].base64 || null;
        setFotos(newFotos);
        Alert.alert('Sucesso', 'Foto adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao escolher foto:', error);
      Alert.alert(
        'Erro',
        'Não foi possível acessar suas fotos. Por favor, tente novamente.'
      );
    }
  };

  const enviarRelato = async () => {
    if (!titulo || !descricao || !endereco || !categoria) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      titulo,
      descricao,
      endereco,
      categoria,
      fotos: fotos.filter(f => !!f && typeof f === 'string' && f.trim().length > 0),
    };

    console.log('Enviando payload:', payload);

    try {
      const response = await fetch('http://172.171.204.34:8000/relatos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Relato enviado com sucesso!');
        limparCampos();
        router.replace({
          pathname: '/telaPrincipal',
          params: { refresh: Date.now() }
        });
      } else {
        const err = await response.json();
        Alert.alert('Erro', 'Erro ao enviar relato:\n' + JSON.stringify(err.detail, null, 2));
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
  };

  const limparCampos = () => {
    setTitulo('');
    setDescricao('');
    setEndereco('');
    setFotos([null, null, null]);
    setCategoria('Iluminação e Energia');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Novo Relato</Text>

      <TextInput placeholder="Título" style={styles.input} value={titulo} onChangeText={setTitulo} />
      <TextInput
        placeholder="Descrição"
        style={styles.descricaoInput}
        multiline
        numberOfLines={5}
        value={descricao}
        onChangeText={setDescricao}
      />
      <TextInput placeholder="Endereço" style={styles.input} value={endereco} onChangeText={setEndereco} />

      <Text style={styles.label}>Adicionar Fotos:</Text>
      <View style={styles.fotosContainer}>
        {fotos.map((foto, index) => (
          <TouchableOpacity key={index} style={styles.fotoBox} onPress={() => escolherFoto(index)}>
            {foto ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${foto}` }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
            ) : (
              <Text style={styles.cameraIcon}>📷</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoria do Relato:</Text>
      <Picker selectedValue={categoria} style={styles.picker} onValueChange={(itemValue) => setCategoria(itemValue)}>
        <Picker.Item label="Iluminação e Energia" value="Iluminação e Energia" />
        <Picker.Item label="Infraestrutura e Mobilidade" value="Infraestrutura e Mobilidade" />
        <Picker.Item label="Limpeza Urbana e Meio Ambiente" value="Limpeza Urbana e Meio Ambiente" />
        <Picker.Item label="Água e Esgoto" value="Água e Esgoto" />
      </Picker>

      <TouchableOpacity style={styles.botaoEnviar} onPress={enviarRelato}>
        <Text style={styles.textoBotao}>Enviar Relato</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 },
  descricaoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  label: { fontSize: 18, marginBottom: 10 },
  fotosContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  fotoBox: {
    width: '30%',
    height: 100,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cameraIcon: { fontSize: 24 },
  picker: { height: 60, width: '100%', marginBottom: 30 },
  botaoEnviar: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default NovoRelato;
