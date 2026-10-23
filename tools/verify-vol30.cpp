#include <bits/stdc++.h>
using namespace std;
int main(){
 const int N=729; int digits[N][6];
 for(int x=0;x<N;x++){int z=x;for(int i=0;i<6;i++){digits[x][i]=z%3+1;z/=3;}}
 int sums[N][64],cnt[64],odd[N][64],even[N][64];
 for(int m=1;m<64;m++)cnt[m]=__builtin_popcount((unsigned)m);
 for(int b=0;b<N;b++)for(int m=1;m<64;m++){int s=0,o=0,e=0;for(int i=0;i<6;i++)if(m>>i&1){s+=digits[b][i];o|=digits[b][i]%2;e|=(digits[b][i]%2==0);}sums[b][m]=s;odd[b][m]=o;even[b][m]=e;}
 uint32_t possible[N][5]={};
 for(int b=0;b<N;b++)for(int m=1;m<64;m++){int s=sums[b][m];uint32_t bit=1u<<s;possible[b][0]|=bit;if(cnt[m]==2)possible[b][1]|=bit;if(cnt[m]==3)possible[b][2]|=bit;if(odd[b][m])possible[b][3]|=bit;if(even[b][m])possible[b][4]|=bit;}
 long long states=0,routes=0,zero[5]={},totalCandidate[5]={},hist[5][19]={};
 for(int b=0;b<N;b++)for(int q=0;q<N;q++){
   uint32_t common[19][5]; bool seen[19]={};int nroute[19]={};
   for(int t=0;t<19;t++)for(int j=0;j<5;j++)common[t][j]=(1u<<19)-2;
   for(int m=1;m<64;m++){
     int t=sums[b][m],after[6],k=0;for(int i=0;i<6;i++)after[i]=(m>>i&1)?digits[q][k++]:digits[b][i];
     int code=0,p=1;for(int i=0;i<6;i++){code+=(after[i]-1)*p;p*=3;}
     seen[t]=true;nroute[t]++;
     for(int j=0;j<5;j++)common[t][j]&=possible[code][j];
   }
   for(int t=1;t<19;t++)if(seen[t]){states++;routes+=nroute[t];for(int j=0;j<5;j++){int c=__builtin_popcount(common[t][j]);zero[j]+=(c==0);totalCandidate[j]+=c;hist[j][c]++;}}
 }
 cout<<"board_queue_pairs "<<N*N<<"\nstates "<<states<<"\nroutes "<<routes<<"\n";
 for(int j=0;j<5;j++){cout<<"mission "<<j<<" zero "<<zero[j]<<" total_candidates "<<totalCandidate[j]<<" histogram";for(int c=0;c<19;c++)if(hist[j][c])cout<<" "<<c<<":"<<hist[j][c];cout<<"\n";}
}
