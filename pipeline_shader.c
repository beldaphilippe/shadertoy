#include <stdio.h>

char* LoadSource(const char *filename)
{
    char *src = NULL;   /* code source de notre shader */
    FILE *fp = NULL;    /* fichier */
    long size;          /* taille du fichier */
    long i;             /* compteur */
    /* on ouvre le fichier */
    fp = fopen(filename, "r");
    /* on verifie si l'ouverture a echoue */
    if(fp == NULL)
    {
        fprintf(stderr, "impossible d'ouvrir le fichier '%s'\n", filename);
        return NULL;
    }
    /* on recupere la longueur du fichier */
    fseek(fp, 0, SEEK_END);
    size = ftell(fp);
    /* on se replace au debut du fichier */
    rewind(fp);
    /* on alloue de la memoire pour y placer notre code source */
    src = malloc(size+1); /* +1 pour le caractere de fin de chaine '\0' */
    if(src == NULL)
    {
        fclose(fp);
        fprintf(stderr, "erreur d'allocation de memoire!\n");
        return NULL;
    }
    /* lecture du fichier */
    for(i=0; i<size; i++)
        src[i] = fgetc(fp);
    /* on place le dernier caractere a '\0' */
    src[size] = '\0';
    fclose(fp);
    return src;
}

int main() {
    GLuint shader;

    shader = glCreateShader(GL_FRAGMENT_SHADER);
    if(shader == 0) {
        fprintf(stderr, "shader creation error\n");
        return;
    }

    char* src = LoadSource("shader0.frag");
    if (src == NULL) return 0; // file loading failed
    glShaderSource(shader, 1, &src, NULL);
    glCompileShader(shader);


    glDeleteShader(shader);
    shader = 0;
}
