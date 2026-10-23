// NUMBER×RUSH Vol.39: partitionable exhaustive checker for digits 1..3 NORMAL/DOUBLE.
// Compile: g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol39.cpp -o /tmp/verify39
// Usage: /tmp/verify39 board_begin board_end queue_begin queue_end
// To prove the whole model, cover all disjoint board partitions [0,46656) with full queues [0,46656).
// Exit 1 if NEXT FREE has no common target; exit 2 for invalid ranges.
#include <array>
#include <cstdint>
#include <cstdlib>
#include <iostream>
using namespace std;
constexpr int N=46656, M=5, T=37;
using Bits=uint64_t;
static array<array<uint8_t,6>,N> tiles;
static array<array<Bits,M>,N> poss;
static array<array<uint8_t,64>,N> sums;
static uint8_t pc[64];
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
 uint64_t states=0,routes=0,zero[M]{},valid[M]{},pairs=0;
 int witness_b=-1,witness_q=-1,witness_t=-1;
 for(int b=bs;b<be;b++)for(int q=qs;q<qe;q++){
  pairs++;Bits common[T][M];bool seen[T]{};
  for(int t=0;t<T;t++)for(int j=0;j<M;j++)common[t][j]=(1ULL<<T)-2;
  for(int mask=1;mask<64;mask++){
   int t=sums[b][mask],after=0,pow=1,k=0;
   for(int i=0;i<6;i++){
    int digit=(mask>>i&1)?tiles[q][k++]:tiles[b][i];
    after+=digit*pow;pow*=6;
   }
   seen[t]=true;routes++;
   for(int j=0;j<M;j++)common[t][j]&=poss[after][j];
  }
  for(int t=1;t<T;t++)if(seen[t]){
   states++;
   for(int j=0;j<M;j++){
    valid[j]+=!!(poss[b][j]&(1ULL<<t));
    if(!common[t][j]){
     zero[j]++;
     if(j==0&&witness_b<0){witness_b=b;witness_q=q;witness_t=t;}
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
