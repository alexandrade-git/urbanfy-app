import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const InfoRelato = () => {
    const router = useRouter();
    const { id, titulo, descricao, endereco, categoria, data_criacao, fotos } = useLocalSearchParams();
    const imagensDisplay = fotos ? JSON.parse(fotos as string) : [];

    const [modalVisible, setModalVisible] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const voltarParaTelaPrincipal = () => {
        router.back();
    };

    const openImageModal = (url: string) => {
        setCurrentImage(url);
        setModalVisible(true);
    };

    const closeImageModal = () => {
        setModalVisible(false);
        setCurrentImage(null);
    };

    const isSingleImage = imagensDisplay.length === 1; // Verifica se há uma única imagem

    return (
        <View style={styles.container}>
            {/* Header com apenas o botão de voltar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={voltarParaTelaPrincipal} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'< Voltar'}</Text>
                </TouchableOpacity>
            </View>

            {/* Título logo abaixo do container */}
            <Text style={styles.titulo}>{titulo}</Text>

            <Text style={styles.subtitulo}>{categoria}</Text>

            {/* Galeria de imagens */}
            <View style={styles.imageScrollWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={isSingleImage ? styles.imageContentSingle : styles.imageContent}
                >
                    {imagensDisplay.map((url: string, index: number) => (
                        <TouchableOpacity key={index} onPress={() => openImageModal(url)}>
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: url }}
                                    style={isSingleImage ? styles.imageSingle : styles.image}
                                    resizeMode="cover"
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Descrição */}
            <TextInput
                style={[styles.textInput, { textAlignVertical: 'top' }]}
                value={descricao as string}
                multiline
                numberOfLines={5}
                maxLength={583}
                editable={false}
            />

            {/* Endereço */}
            <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Endereço do Relato:</Text>
                <Text style={styles.addressText}>{endereco}</Text>
            </View>

            {/* Data de criação */}
            <View style={styles.footer}>
                <Text style={styles.creationDate}>Relato criado no dia {new Date(data_criacao as string).toLocaleDateString('pt-BR')}</Text>
            </View>

            {/* Modal de Imagem */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImageModal}
            >
                <TouchableOpacity style={styles.modalContainer} onPress={closeImageModal}>
                    <View style={styles.modalContent}>
                        {/* Imagem maior */}
                        {currentImage && (
                            <Image
                                source={{ uri: currentImage }}
                                style={styles.modalImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        height: 40,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20, // Mover o título para baixo
    },
    subtitulo: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
    },
    imageScrollWrapper: {
        marginBottom: 15,
        marginTop: 25,
        maxHeight: height / 2.5,
    },
    imageContent: {
        alignItems: 'center',
    },
    imageContentSingle: {
        justifyContent: 'center', // Centraliza o conteúdo horizontalmente
        alignItems: 'center', // Centraliza a imagem no meio
        flex: 1, // Preenche a tela se houver uma única imagem
    },
    imageWrapper: {
        marginRight: 10,
    },
    image: {
        height: 200,
        width: width / 2,
        borderRadius: 10,
        backgroundColor: '#ccc',
    },
    imageSingle: {
        height: 200,
        width: width * 0.8, // Ajusta a largura para 80% da tela
        borderRadius: 10,
        backgroundColor: '#ccc',
    },
    textInput: {
        height: 200,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    addressContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    addressLabel: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginTop: 4,
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: 16,
        alignItems: 'center',
    },
    creationDate: {
        fontSize: 14,
        color: 'gray',
    },

    // Estilos do Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Escurece o fundo
    },
    modalContent: {
        justifyContent: 'center',
        alignItems: 'center',
        width: width - 40,
        height: height / 1.5, // Tamanho ajustado da imagem
    },
    modalImage: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
    },
});

export default InfoRelato;
