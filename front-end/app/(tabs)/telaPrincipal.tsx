import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';

const ReportsScreen = () => {
    interface Report {
        id: string;
        fotos: string[];
        titulo: string;
        descricao: string;
        endereco: string;
        categoria: string;
        data_criacao: string;
    }

    const [reportsData, setReportsData] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const params = useLocalSearchParams();
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = (screenWidth - 60) / 2;
    const NUM_COLUMNS = 2;

    const navegarParaNovoRelato = () => {
        router.push('/novoRelato');
    };

    const carregarRelatos = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://172.171.204.34:8000/relatos');
            if (!response.ok) {
                throw new Error('Erro ao carregar relatos');
            }
            const data = await response.json();
            setReportsData(data);
            setFilteredReports(data);
        } catch (err) {
            setError('Não foi possível carregar os relatos. Tente novamente mais tarde.');
            console.error('Erro ao carregar relatos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarRelatos();
    }, []);

    // Efeito para recarregar quando voltar da tela de novo relato
    useEffect(() => {
        if (params.refresh) {
            carregarRelatos();
        }
    }, [params.refresh]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        carregarRelatos().finally(() => setRefreshing(false));
    }, []);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredReports(reportsData);
        } else {
            const filtered = reportsData.filter(report => 
                report.titulo.toLowerCase().includes(text.toLowerCase()) ||
                report.descricao.toLowerCase().includes(text.toLowerCase()) ||
                report.endereco.toLowerCase().includes(text.toLowerCase()) ||
                report.categoria.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredReports(filtered);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const renderReportCard = ({ item }: { item: Report }) => (
        <TouchableOpacity 
            style={[styles.reportCard, { width: cardWidth }]}
            onPress={() => {
                // Aqui você pode adicionar a navegação para a tela de detalhes do relato
                console.log('Relato selecionado:', item.id);
            }}
        >
            <Image
                source={{ 
                    uri: item.fotos && item.fotos.length > 0 
                        ? item.fotos[0] 
                        : 'https://via.placeholder.com/150'
                }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={1}>{item.titulo}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.endereco}</Text>
                <Text style={styles.category}>{item.categoria}</Text>
                <Text style={styles.date}>{formatDate(item.data_criacao)}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando relatos...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={carregarRelatos}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput 
                    style={styles.searchBar} 
                    placeholder="Procure um Relato" 
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton}>
                    <MaterialIcons name="search" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>Últimos Relatos:</Text>

            {filteredReports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="info-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'Nenhum relato encontrado para sua busca' : 'Nenhum relato encontrado'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredReports}
                    numColumns={NUM_COLUMNS}
                    key={NUM_COLUMNS.toString()}
                    renderItem={renderReportCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                            tintColor="#007AFF"
                        />
                    }
                />
            )}

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
        backgroundColor: '#fff' 
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    searchBar: { 
        flex: 1, 
        height: 40, 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 5, 
        paddingHorizontal: 10 
    },
    searchButton: { 
        padding: 10 
    },
    header: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 15,
        color: '#333'
    },
    listContainer: {
        paddingBottom: 20
    },
    reportCard: { 
        backgroundColor: '#fff',
        margin: 5,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden'
    },
    image: { 
        width: '100%', 
        height: 120, 
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12
    },
    cardContent: {
        padding: 10
    },
    title: { 
        fontSize: 16, 
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    description: { 
        fontSize: 14, 
        color: '#666',
        marginBottom: 4
    },
    category: { 
        fontSize: 12, 
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4
    },
    date: {
        fontSize: 12,
        color: '#999'
    },
    newReportButton: { 
        backgroundColor: '#007AFF', 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: 'bold',
        fontSize: 16
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center'
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
        textAlign: 'center'
    }
});

export default ReportsScreen;
