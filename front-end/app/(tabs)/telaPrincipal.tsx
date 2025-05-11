import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Defina um tipo para os relatos
type Report = {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    fotos: string[]; // Lista de URLs de imagens
    endereco: string; // Endereço do relato
    data_criacao: string; // Data de criação
};

const normalize = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ReportsScreen = () => {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const [reportsData, setReportsData] = useState<Report[]>([]); // Lista original de relatos
    const [filteredReports, setFilteredReports] = useState<Report[]>([]); // Relatos filtrados
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Função para obter os relatos da API
    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://172.171.204.34:8000/relatos'); // URL da sua API
            const data = await response.json();
            setReportsData(data);
            setFilteredReports(data); // Inicializa com todos os relatos
        } catch (error) {
            console.error('Erro ao buscar relatos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(); // Buscar os relatos quando o componente carregar
    }, []);

    const aplicarFiltro = () => {
        const textoBusca = searchText.toLowerCase();

        const filtrados = reportsData.filter((report) => {
            const campos = [
                report.titulo,
                report.descricao,
                report.categoria,
                report.endereco
            ];

            return campos.some((campo) => {
                const original = campo.toLowerCase();
                const normalizado = normalize(campo);

                return (
                    original.includes(textoBusca) ||
                    normalizado.includes(normalize(textoBusca))
                );
            });
        });

        setFilteredReports(filtrados);
    };


    useEffect(() => {
        aplicarFiltro(); // Aplica filtro ao texto de busca
    }, [searchText]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchReports(); // Atualiza os relatos ao fazer pull to refresh
        setRefreshing(false);
        aplicarFiltro(); // Aplica o filtro com o texto atual da pesquisa
    };

    const navegarParaNovoRelato = () => {
        router.push('/novoRelato');
    };


    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Procure um Relato"
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleRefresh}>
                    <MaterialIcons name="search" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <Text style={styles.header}>Meus Relatos:</Text>
            <FlatList
                data={filteredReports}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.reportCard}
                        onPress={() =>
                            router.push({
                                pathname: '/infoRelato',
                                params: {
                                    id: item.id,
                                    titulo: item.titulo,
                                    descricao: item.descricao,
                                    endereco: item.endereco,
                                    categoria: item.categoria,
                                    data_criacao: item.data_criacao,
                                    fotos: JSON.stringify(item.fotos),
                                },
                            })
                        }

                    >
                        {item.fotos.length > 0 ? (
                            <Image
                                source={{ uri: item.fotos[0] }}
                                style={styles.image}
                            />
                        ) : (
                            <Image
                                source={{ uri: 'https://via.placeholder.com/150' }}
                                style={styles.image}
                            />
                        )}
                        <Text style={styles.title}>{item.titulo}</Text>
                        <Text style={styles.description}>{item.descricao}</Text>
                        <Text style={styles.category}>{item.categoria}</Text>
                        <Text style={styles.date}>{new Date(item.data_criacao).toLocaleDateString('pt-BR')}</Text>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyListText}>Nenhum relato encontrado.</Text>
                }
            />
            <TouchableOpacity style={styles.newReportButton} onPress={navegarParaNovoRelato}>
                <Text style={styles.buttonText}>Novo Relato</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchBar: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
    },
    searchButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    reportCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 100,
        borderRadius: 5,
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    category: {
        fontSize: 12,
        color: '#999',
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    newReportButton: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyListText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
    },
});

export default ReportsScreen;
