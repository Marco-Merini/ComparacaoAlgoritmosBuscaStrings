import { NaiveSearch } from './src/core/strategy/NaiveSearch';
import { RabinKarpSearch } from './src/core/strategy/RabinKarpSearch';
import { KMPSearch } from './src/core/strategy/KMPSearch';
import { BoyerMooreSearch } from './src/core/strategy/BoyerMooreSearch';
import { SearchContext } from './src/core/strategy/SearchContext';

const text = "A maravilhosa aplicação de busca de strings funciona de verdade!";
const pattern = "busca";
const expectedOccurrences = [27]; // A posição exata da palavra 'busca'

const algorithms = [
    new NaiveSearch(),
    new RabinKarpSearch(),
    new KMPSearch(),
    new BoyerMooreSearch()
];

console.log("==========================================");
console.log(` Texto Alvo : "${text}"`);
console.log(` Padrão (Chave): "${pattern}"`);
console.log(" Ocorrências Esperadas:", expectedOccurrences);
console.log("==========================================\n");

algorithms.forEach(strategy => {
    const context = new SearchContext(strategy);
    try {
        const result = context.execute(text, pattern);
        const match = JSON.stringify(result.occurrences) === JSON.stringify(expectedOccurrences);
        
        console.log(`[${match ? 'PASSOU ✔' : 'FALHOU ❌'}] Algoritmo: ${strategy.name}`);
        console.log(`   - Encontrou nos índices:`, result.occurrences);
        console.log(`   - Total de Comparações realizadas:`, result.comparisons);
        console.log(`   - Tempo Computado: ${result.timeMs.toFixed(3)} ms`);
        console.log("------------------------------------------");
    } catch (e) {
        console.error(`[FALHOU ❌] Erro ao executar ${strategy.name}:`, e);
    }
});
