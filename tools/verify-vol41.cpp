// Vol.41: safe queue-prefix equivalence cache. No positional permutation assumed.
// Compile: g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol41.cpp -o /tmp/verify41
// Run: /tmp/verify41 board_begin board_end queue_begin queue_end
#include <array>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;
constexpr int N=46656,M=5,T=37;
using Bits=uint64_t;
static array<array<uint8_t,6>,N> tiles;
static array<array<Bits,M>,N> poss;
static array<array<uint8_t,64>,N> sums;
static uint8_t pc[64];
static int powers[7]={1,6,36,216,1296,7776,46656};
int main(int argc,char**argv){
 int bs=argc>1?atoi(argv[1]):0,be=argc>2?atoi(argv[2]):N;
 int qs=argc>3?atoi(argv[3]):0,qe=argc>4?atoi(argv[4]):N;
 if(bs<0||be>N||bs>=be||qs<0||qe>N||qs>=qe){cerr<<"invalid ranges\n";return 2;}
 for(int m=1;m<64;m++)pc[m]=__builtin_popcount((unsigned)m);
 for(int b=0;b<N;b++){
  int z=b;for(int i=0;i<6;i++){tiles[b][i]=z%6;z/=6;}
  for(int mask=1;mask<64;mask++){
   int s=0,odd=0,even=0;
   for(int i=0;i<6;i++)if(mask>>i&1){
    int v=tiles[b][i]%3+1;s+=v*(1+tiles[b][i]/3);
    odd|=v&1;even|=!(v&1);
   }
   sums[b][mask]=s;Bits bit=1ULL<<s;
   poss[b][0]|=bit;
   if(pc[mask]==2)poss[b][1]|=bit;
   if(pc[mask]==3)poss[b][2]|=bit;
   if(odd)poss[b][3]|=bit;
   if(even)poss[b][4]|=bit;
  }
 }
 // For a k-tile consumption, the successor depends only on the first k queue tiles.
 // Refill uses selected positions in ascending order, so arbitrary position permutations
 // are NOT assumed to be valid symmetries.
 vector<array<Bits,M>> cache(64*46656);
 uint64_t states=0,routes=0,zero[M]{},valid[M]{},pairs=0;
 int witness_b=-1,witness_q=-1,witness_t=-1;
 for(int b=bs;b<be;b++){
  for(int mask=1;mask<64;mask++){
   int k=pc[mask],prefixCount=powers[k];
   for(int prefix=0;prefix<prefixCount;prefix++){
    int after=0,place=1,x=prefix;
    for(int i=0;i<6;i++){
     int digit;
     if(mask>>i&1){digit=x%6;x/=6;}else digit=tiles[b][i];
     after+=digit*place;place*=6;
    }
    cache[mask*46656+prefix]=poss[after];
   }
  }
  for(int q=qs;q<qe;q++){
   pairs++;Bits common[T][M];bool seen[T]{};
   for(int t=0;t<T;t++)for(int j=0;j<M;j++)common[t][j]=(1ULL<<T)-2;
   for(int mask=1;mask<64;mask++){
    int t=sums[b][mask];
    const auto &p=cache[mask*46656+(q%powers[pc[mask]])];
    seen[t]=true;routes++;
    for(int j=0;j<M;j++)common[t][j]&=p[j];
   }
   for(int t=1;t<T;t++)if(seen[t]){
    states++;
    for(int j=0;j<M;j++){
     valid[j]+=!!(poss[b][j]&(1ULL<<t));
     if(!common[t][j]){zero[j]++;if(j==0&&witness_b<0){witness_b=b;witness_q=q;witness_t=t;}}
    }
   }
  }
 }
 cout<<"board_range="<<bs<<":"<<be<<" queue_range="<<qs<<":"<<qe<<" pairs="<<pairs<<" states="<<states<<" routes="<<routes<<"\n";
 const char* names[]={"FREE","PAIR","TRIPLE","ODD","EVEN"};
 for(int j=0;j<M;j++)cout<<names[j]<<" valid="<<valid[j]<<" zero="<<zero[j]<<"\n";
 if(witness_b>=0)cout<<"COUNTEREXAMPLE_FREE board="<<witness_b<<" queue="<<witness_q<<" target="<<witness_t<<"\n";
 cout<<"RESULT: "<<(witness_b>=0?"FREE counterexample found":"no FREE counterexample in tested partition")<<"\n";
 return witness_b>=0?1:0;
}
